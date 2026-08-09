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

const CLAVE_SESION = 'aguavigia_veedor_token'

export const sesionVeedor = {
  obtener: () => sessionStorage.getItem(CLAVE_SESION),
  guardar: (token: string) => sessionStorage.setItem(CLAVE_SESION, token),
  limpiar: () => sessionStorage.removeItem(CLAVE_SESION),
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 8_000,
})

apiClient.interceptors.request.use((config) => {
  const token = sesionVeedor.obtener()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) sesionVeedor.limpiar()
    return Promise.reject(error)
  },
)

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
    401: 'La clave no es correcta o la sesión venció.',
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
