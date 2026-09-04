import axios from 'axios'
import type { AxiosError } from 'axios'
import type { components } from './generated/schema'

export type ProblemDetail = components['schemas']['ProblemDetail']

export interface ErrorApi {
  estado: number | null
  titulo: string
  detalle: string
  reintentable: boolean
}

const CLAVE_SESION = 'aguavigia_veedor_sesion'

/** Los permisos que el backend puede emitir (ver el enum Permiso del dominio). */
export type Permiso =
  | 'VER_PANEL'
  | 'MODERAR_REPORTES'
  | 'GESTIONAR_CORTES'
  | 'REVISAR_INGESTA'
  | 'GESTIONAR_USUARIOS'
  | 'VER_AUDITORIA'
  | 'CONFIGURAR_SEGUNDO_FACTOR'

export type RolVeedor = 'ADMIN' | 'VEEDOR' | 'OBSERVADOR'

export interface SesionVeedor {
  token: string
  usuarioId: string
  nombre: string
  correo: string
  rol: RolVeedor
  permisos: Permiso[]
  /** ALTA_SEGUNDO_FACTOR: la sesión solo sirve para dar de alta el TOTP y nada más. */
  alcance: 'COMPLETO' | 'ALTA_SEGUNDO_FACTOR'
}

// F1 — el interceptor de 401 de más abajo borra la sesión sin que ninguna pantalla se entere: el
// panel del veedor se quedaba "atascado" mostrando el contenido protegido con todas las consultas
// fallando en silencio. `alCambiar` deja que la UI reaccione en el momento exacto en que la
// sesión deja de ser válida, sin que cada componente tenga que releer sessionStorage por su cuenta.
const eventosSesion = new EventTarget()
const EVENTO_SESION_CAMBIADA = 'sesion-cambiada'

/**
 * sessionStorage y no localStorage: la sesión muere al cerrar la pestaña. En un panel de moderación
 * que se abre a menudo desde equipos compartidos, sobrevivir al cierre del navegador es un riesgo,
 * no una comodidad.
 *
 * Nada de lo que se guarda aquí decide nada por su cuenta — el backend revalida permisos en cada
 * petición. Sirve para pintar la interfaz, no para autorizar.
 */
export const sesionVeedor = {
  obtener: (): SesionVeedor | null => {
    const bruto = sessionStorage.getItem(CLAVE_SESION)
    if (!bruto) return null
    try {
      const sesion = JSON.parse(bruto) as SesionVeedor
      return typeof sesion?.token === 'string' ? sesion : null
    } catch {
      // Un valor corrupto no debe dejar la pestaña inservible hasta que alguien limpie a mano.
      sessionStorage.removeItem(CLAVE_SESION)
      return null
    }
  },
  obtenerToken: (): string | null => sesionVeedor.obtener()?.token ?? null,
  guardar: (sesion: SesionVeedor) => {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    eventosSesion.dispatchEvent(new Event(EVENTO_SESION_CAMBIADA))
  },
  limpiar: () => {
    sessionStorage.removeItem(CLAVE_SESION)
    eventosSesion.dispatchEvent(new Event(EVENTO_SESION_CAMBIADA))
  },
  alCambiar: (callback: () => void) => {
    eventosSesion.addEventListener(EVENTO_SESION_CAMBIADA, callback)
    return () => eventosSesion.removeEventListener(EVENTO_SESION_CAMBIADA, callback)
  },
  puede: (permiso: Permiso): boolean => sesionVeedor.obtener()?.permisos.includes(permiso) ?? false,
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8_000,
})

apiClient.interceptors.request.use((config) => {
  const token = sesionVeedor.obtenerToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // El 401 de "falta el segundo factor" no significa sesión vencida: es la mitad del login. Si
    // se limpiara aquí, el formulario perdería el estado justo cuando va a pedir el código.
    const tipo = (error.response?.data as ProblemDetail | undefined)?.type
    if (error.response?.status === 401 && tipo !== TIPO_SEGUNDO_FACTOR_REQUERIDO) {
      sesionVeedor.limpiar()
    }
    return Promise.reject(error)
  },
)

export const TIPO_SEGUNDO_FACTOR_REQUERIDO =
  'https://aguavigia.example/errores/segundo-factor-requerido'

/** `type` de un ProblemDetail, o null si la respuesta no venía en formato RFC 7807. */
export function tipoDeProblema(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null
  return (error.response?.data as ProblemDetail | undefined)?.type ?? null
}

export function normalizarErrorApi(error: unknown): ErrorApi {
  if (!axios.isAxiosError(error)) {
    return {
      estado: null,
      titulo: 'No pudimos completar la solicitud',
      detalle: 'Revisa tu conexión e inténtalo otra vez.',
      reintentable: true,
    }
  }

  const problema = error.response?.data as ProblemDetail | undefined
  const estado = error.response?.status ?? null
  const detallePorEstado: Record<number, string> = {
    401: 'El correo o la clave no son correctos.',
    403: 'Tu cuenta no tiene acceso a esto.',
    423: 'La cuenta quedó bloqueada por demasiados intentos. Espera unos minutos.',
    409: 'Ya existe una solicitud con estos datos.',
    429: 'Se hicieron demasiados intentos. Espera un momento y vuelve a probar.',
    503: 'Esta función todavía no está configurada en el servidor.',
  }

  return {
    estado,
    titulo: problema?.title || 'No pudimos completar la solicitud',
    detalle: problema?.detail || (estado ? detallePorEstado[estado] : undefined) || 'Revisa tu conexión e inténtalo otra vez.',
    reintentable: estado === null || estado >= 500,
  }
}
