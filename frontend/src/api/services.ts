import type { components } from './generated/schema'
import type { EstadoServicio } from '../types/tipos-dominio'
import { apiClient, sesionVeedor } from './client'
import type { Permiso, RolVeedor, SesionVeedor } from './client'
import { obtenerHuellaDispositivo } from '../utils/huellaDispositivo'

type SectorApi = components['schemas']['SectorRespuesta']
type RespuestaSectoresApi = components['schemas']['RespuestaSectores']
export type SolicitudSuscripcion = Required<components['schemas']['SolicitudSuscripcion']>
export type SuscripcionRespuesta = components['schemas']['SuscripcionRespuesta']
type SolicitudReporteApi = components['schemas']['SolicitudReporte']
export type SolicitudReporte = Required<Pick<SolicitudReporteApi, 'sectorId' | 'tipo' | 'huella'>> &
  Pick<SolicitudReporteApi, 'coordenada'>
export type ReporteRespuesta = components['schemas']['ReporteRespuesta']
export type TipoReporte = 'SIN_AGUA' | 'PRESION_BAJA' | 'SERVICIO_RESTABLECIDO'
type SolicitudConfirmarApi = components['schemas']['SolicitudConfirmar']
export type SolicitudConfirmar = Required<SolicitudConfirmarApi>
type ReporteModeracionApi = components['schemas']['ReporteModeracionRespuesta']
export type ReporteModeracion = Required<Pick<ReporteModeracionApi, 'id' | 'sectorId' | 'tipo' | 'timestamp' | 'estadoModeracion'>> &
  Pick<ReporteModeracionApi, 'coordenada'>
type SolicitudCorteApi = components['schemas']['SolicitudCorte']
export type SolicitudCorte = Required<Pick<SolicitudCorteApi, 'sectoresAfectados' | 'inicio' | 'finPrometido' | 'causa'>>
export type CorteOficial = components['schemas']['CorteRespuesta']
type EventoBitacoraApi = components['schemas']['EventoBitacoraRespuesta']
/** Los cuatro de `TipoEvento` en el backend. Faltaba CORTE_DETECTADO_POR_INGESTA, y por eso todo
 *  lo que publica la ingesta caía en el cajón "informativo", sin color ni filtro. */
export type TipoEventoBitacora =
  | 'CORTE_ANUNCIADO'
  | 'CORTE_CONFIRMADO_POR_CIUDADANOS'
  | 'CORTE_RESTABLECIDO'
  | 'CORTE_DETECTADO_POR_INGESTA'
export type EventoBitacora = Required<Pick<EventoBitacoraApi, 'id' | 'tipo' | 'timestamp' | 'descripcion'>> &
  Pick<EventoBitacoraApi, 'sectorId' | 'corteId'> & {
    /** Estado que afirma el evento. Nulo cuando el evento no habla del servicio. */
    estado?: EstadoServicio | null
    /** Boletín que respalda el evento — de aquí sale el enlace "Leer documento". */
    urlOriginal?: string | null
    /** Portada del boletín, capturada por el colector al ingerir. */
    imagenUrl?: string | null
  }

// --- Interfaces del Índice de Cumplimiento (M6, RF020-RF025) ---
export interface IndiceCumplimiento {
  sectorId: string | null
  duracionPrometidaSegundos: number
  duracionRealSegundos: number
  desviacionSegundos: number
  porcentajeCumplimiento: number
}

export interface PuntoSerieCumplimiento {
  periodo: string
  duracionPrometidaSegundos: number
  duracionRealSegundos: number
  desviacionSegundos: number
  porcentajeCumplimiento: number
  cantidadCortes: number
}

// --- Interfaces de Estadísticas (M7) ---
export interface EstadisticaSector {
  sectorId: string
  nombre: string
  cantidadCortes: number
}

export interface EstadisticasGlobales {
  sectoresMasAfectados: EstadisticaSector[]
  cortesPorDiaDeSemana: Record<string, number>
  duracionPromedioHoras: number
}

export interface SectorSeguro {
  id: string
  nombre: string
  estado: Exclude<SectorApi['estado'], undefined>
  actualizadoEn: string | null
}

export interface RespuestaSectoresSegura {
  sectores: SectorSeguro[]
  generadoEn: string
}

function validarSector(valor: SectorApi): SectorSeguro | null {
  if (!valor || typeof valor.id !== 'string' || typeof valor.nombre !== 'string') return null
  const estados = ['CON_SERVICIO', 'SIN_SERVICIO', 'PRESION_BAJA', 'CORTE_PROGRAMADO']
  const estado = valor.estado == null || estados.includes(valor.estado) ? valor.estado ?? null : null
  return {
    id: valor.id,
    nombre: valor.nombre,
    estado,
    actualizadoEn: typeof valor.actualizadoEn === 'string' ? valor.actualizadoEn : null,
  }
}

export function validarRespuestaSectores(valor: RespuestaSectoresApi): RespuestaSectoresSegura {
  if (!valor || !Array.isArray(valor.sectores) || typeof valor.generadoEn !== 'string') {
    throw new Error('El servidor devolvió una respuesta de sectores inválida.')
  }
  const sectores = valor.sectores.map(validarSector).filter((sector): sector is SectorSeguro => sector !== null)
  if (sectores.length !== valor.sectores.length) throw new Error('Uno o más sectores no cumplen el contrato OpenAPI.')
  return { sectores, generadoEn: valor.generadoEn }
}

export async function obtenerSectores(): Promise<RespuestaSectoresSegura> {
  const { data } = await apiClient.get<RespuestaSectoresApi>('/sectores')
  return validarRespuestaSectores(data)
}

/** Detalle de un sector — el enlace "ver mi sector" de los correos de aviso apunta aquí. */
export async function obtenerSector(id: string): Promise<SectorSeguro> {
  const { data } = await apiClient.get<SectorApi>(`/sectores/${encodeURIComponent(id)}`)
  const sector = validarSector(data)
  if (!sector) throw new Error('El servidor devolvió un sector inválido.')
  return sector
}

export async function crearSuscripcion(datos: SolicitudSuscripcion): Promise<SuscripcionRespuesta> {
  const { data } = await apiClient.post<SuscripcionRespuesta>('/suscripciones', datos)
  return data
}

export async function crearReporte(datos: SolicitudReporte): Promise<ReporteRespuesta> {
  const { data } = await apiClient.post<ReporteRespuesta>('/reportes', datos)
  return data
}

/** Flujo ciudadano abreviado usado desde el mapa y la pantalla de reporte. */
export async function registrarReporteCiudadano(sectorId: string, tipo: TipoReporte): Promise<ReporteRespuesta> {
  return crearReporte({
    sectorId,
    tipo,
    huella: await obtenerHuellaDispositivo(),
  })
}

/** Adjunta una foto de evidencia a un reporte ya creado (M10). */
export async function agregarEvidenciaReporte(id: string, foto: File): Promise<ReporteRespuesta> {
  const cuerpo = new FormData()
  cuerpo.append('foto', foto)
  const { data } = await apiClient.post<ReporteRespuesta>(`/reportes/${encodeURIComponent(id)}/foto`, cuerpo, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** Confirmación ciudadana de un reporte ajeno, con la propia huella anónima (M11, RF038). */
export async function confirmarReporte(id: string): Promise<ReporteRespuesta> {
  const { data } = await apiClient.post<ReporteRespuesta>(`/reportes/${encodeURIComponent(id)}/confirmar`, {
    huella: await obtenerHuellaDispositivo(),
  } satisfies SolicitudConfirmar)
  return data
}

// --- Estadísticas (M7) ---
export async function obtenerEstadisticas(): Promise<EstadisticasGlobales> {
  const { data } = await apiClient.get<EstadisticasGlobales>('/estadisticas')
  return data
}

/** `/api/bitacora` y las dos colas del veedor paginan (50 por defecto, 200 máximo) desde el
 *  backend y devuelven el total real en `X-Total-Count` — ver `CabecerasDePaginacion`. */
export interface ListaConTotal<T> {
  items: T[]
  /** Total real en el servidor, no `items.length`: si supera `items.length`, hay más de lo que se pidió. */
  totalCount: number
}

const TAMANO_MAXIMO_COLA = 200

function totalDesdeCabecera(headers: unknown, porDefecto: number): number {
  const valor = (headers as Record<string, string> | undefined)?.['x-total-count']
  const numero = valor ? Number(valor) : NaN
  return Number.isFinite(numero) ? numero : porDefecto
}

/** Cola completa de moderación (RF018): pide el máximo de una vez porque el veedor necesita verla
 *  entera, no navegarla por páginas — un reporte que quede fuera de la primera página no se
 *  moderaría nunca. `totalCount` deja ver si aun así sobran más de 200. */
export async function listarReportesPendientes(): Promise<ListaConTotal<ReporteModeracion>> {
  const { data, headers } = await apiClient.get<ReporteModeracionApi[]>('/veedor/reportes/pendientes', {
    params: { tamano: TAMANO_MAXIMO_COLA },
  })
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una cola de moderación inválida.')
  const reportes = data.filter((reporte): reporte is ReporteModeracion =>
    typeof reporte.id === 'string' &&
    typeof reporte.sectorId === 'string' &&
    typeof reporte.tipo === 'string' &&
    typeof reporte.timestamp === 'string' &&
    typeof reporte.estadoModeracion === 'string')
  if (reportes.length !== data.length) throw new Error('Uno o más reportes no cumplen el contrato OpenAPI.')
  return { items: reportes, totalCount: totalDesdeCabecera(headers, reportes.length) }
}

export async function moderarReporte(id: string, decision: 'aprobar' | 'descartar'): Promise<ReporteModeracionApi> {
  const { data } = await apiClient.patch<ReporteModeracionApi>(`/veedor/reportes/${encodeURIComponent(id)}/${decision}`)
  return data
}

export async function listarCortesPorSector(sectorId: string): Promise<CorteOficial[]> {
  const { data } = await apiClient.get<CorteOficial[]>('/veedor/cortes', { params: { sectorId } })
  return data
}

/** Detalle de un corte, con datos frescos del servidor (el listado ya trae casi todo, pero
 *  esto garantiza la versión más reciente si otro veedor lo modificó mientras tanto). */
export async function obtenerCorte(id: string): Promise<CorteOficial> {
  const { data } = await apiClient.get<CorteOficial>(`/veedor/cortes/${encodeURIComponent(id)}`)
  return data
}

export async function crearCorteOficial(solicitud: SolicitudCorte): Promise<CorteOficial> {
  const { data } = await apiClient.post<CorteOficial>('/veedor/cortes', solicitud)
  return data
}

export async function cerrarCorteOficial(id: string, horaReal: string): Promise<CorteOficial> {
  const { data } = await apiClient.patch<CorteOficial>(`/veedor/cortes/${encodeURIComponent(id)}/cierre`, { horaReal })
  return data
}

// --- Cuentas del panel (ADR-039) ---

function comoSesion(data: unknown): SesionVeedorApi {
  if (!data || typeof data !== 'object' || typeof (data as SesionVeedorApi).token !== 'string') {
    throw new Error('El servidor no devolvió una sesión válida.')
  }
  return data as SesionVeedorApi
}

type SesionVeedorApi = SesionVeedor

/**
 * `codigoTotp` se omite en el primer intento. Si la cuenta tiene segundo factor, el backend
 * responde 401 con type `segundo-factor-requerido` y la pantalla reintenta con el código — por eso
 * el interceptor de client.ts no limpia la sesión ante ese type concreto.
 */
export async function iniciarSesionVeedor(
  correo: string,
  clave: string,
  codigoTotp?: string,
): Promise<SesionVeedor> {
  const { data } = await apiClient.post<unknown>('/veedor/sesion', {
    correo,
    clave,
    codigoTotp: codigoTotp?.trim() || undefined,
  })
  const sesion = comoSesion(data)
  sesionVeedor.guardar(sesion)
  return sesion
}

/** Revoca en el servidor, no solo en esta pestaña: un token copiado deja de servir en el acto. */
export async function cerrarSesionVeedor(): Promise<void> {
  try {
    await apiClient.post('/veedor/sesion/cierre')
  } catch {
    // Si la llamada falla (sesión ya vencida, red caída) igual se limpia el cliente: dejar el
    // token en la pestaña sería lo peor de los dos mundos.
  } finally {
    sesionVeedor.limpiar()
  }
}

export async function solicitarCuenta(correo: string, nombre: string, clave: string): Promise<void> {
  await apiClient.post('/cuentas/registro', { correo, nombre, clave })
}

export async function verificarCorreo(token: string): Promise<void> {
  await apiClient.post(`/cuentas/verificacion?token=${encodeURIComponent(token)}`)
}

export async function aceptarInvitacion(token: string, clave: string): Promise<void> {
  await apiClient.post('/cuentas/invitacion', { token, clave })
}

export async function pedirRestablecimiento(correo: string): Promise<void> {
  await apiClient.post('/cuentas/restablecimiento', { correo })
}

export async function fijarClaveNueva(token: string, clave: string): Promise<void> {
  await apiClient.post('/cuentas/clave', { token, clave })
}

// --- Segundo factor (TOTP) ---

export interface AltaSegundoFactor {
  uri: string
  secreto: string
}

export async function iniciarAltaSegundoFactor(): Promise<AltaSegundoFactor> {
  const { data } = await apiClient.post<AltaSegundoFactor>('/veedor/segundo-factor/alta')
  return data
}

/** Devuelve una sesión nueva de alcance COMPLETO y la deja guardada. */
export async function confirmarSegundoFactor(codigo: string): Promise<SesionVeedor> {
  const { data } = await apiClient.post<unknown>('/veedor/segundo-factor/confirmacion', { codigo })
  const sesion = comoSesion(data)
  sesionVeedor.guardar(sesion)
  return sesion
}

export async function desactivarSegundoFactor(codigo: string): Promise<void> {
  await apiClient.post('/veedor/segundo-factor/baja', { codigo })
}

// --- Administración de cuentas (solo ADMIN) ---

export interface CuentaPanel {
  id: string
  correo: string
  nombre: string
  estado:
    | 'PENDIENTE_VERIFICACION'
    | 'PENDIENTE_APROBACION'
    | 'INVITADA'
    | 'ACTIVA'
    | 'SUSPENDIDA'
    | 'RECHAZADA'
  rol: RolVeedor
  permisosEfectivos: Permiso[]
  permisosConcedidos: Permiso[]
  permisosRevocados: Permiso[]
  segundoFactorActivo: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface AjustePermisos {
  rol: RolVeedor
  concedidos?: Permiso[]
  revocados?: Permiso[]
}

export async function listarCuentas(estado?: string): Promise<CuentaPanel[]> {
  const { data } = await apiClient.get<CuentaPanel[]>('/veedor/usuarios', {
    params: { estado: estado || undefined, tamano: 200 },
  })
  return Array.isArray(data) ? data : []
}

export async function invitarCuenta(
  correo: string,
  nombre: string,
  rol: RolVeedor,
): Promise<CuentaPanel> {
  const { data } = await apiClient.post<CuentaPanel>('/veedor/usuarios/invitaciones', {
    correo,
    nombre,
    rol,
  })
  return data
}

export async function aprobarCuenta(id: string, permisos: AjustePermisos): Promise<CuentaPanel> {
  const { data } = await apiClient.patch<CuentaPanel>(
    `/veedor/usuarios/${encodeURIComponent(id)}/aprobacion`,
    permisos,
  )
  return data
}

export async function rechazarCuenta(id: string): Promise<CuentaPanel> {
  const { data } = await apiClient.patch<CuentaPanel>(
    `/veedor/usuarios/${encodeURIComponent(id)}/rechazo`,
  )
  return data
}

export async function suspenderCuenta(id: string): Promise<CuentaPanel> {
  const { data } = await apiClient.patch<CuentaPanel>(
    `/veedor/usuarios/${encodeURIComponent(id)}/suspension`,
  )
  return data
}

export async function reactivarCuenta(id: string): Promise<CuentaPanel> {
  const { data } = await apiClient.patch<CuentaPanel>(
    `/veedor/usuarios/${encodeURIComponent(id)}/reactivacion`,
  )
  return data
}

export async function cambiarPermisosCuenta(
  id: string,
  permisos: AjustePermisos,
): Promise<CuentaPanel> {
  const { data } = await apiClient.patch<CuentaPanel>(
    `/veedor/usuarios/${encodeURIComponent(id)}/permisos`,
    permisos,
  )
  return data
}

export interface AsientoAuditoria {
  id: string
  accion: string
  autorCorreo: string | null
  sujetoCorreo: string | null
  detalle: string | null
  ip: string | null
  ocurrioEn: string
}

export async function listarAuditoria(tamano = 100): Promise<AsientoAuditoria[]> {
  const { data } = await apiClient.get<AsientoAuditoria[]>('/veedor/auditoria', {
    params: { tamano },
  })
  return Array.isArray(data) ? data : []
}

// --- Bitácora pública (M8) ---
export async function listarBitacora(tamano = 20): Promise<EventoBitacora[]> {
  const { data } = await apiClient.get<EventoBitacoraApi[]>('/bitacora', { params: { tamano } })
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una bitácora inválida.')
  const eventos = data.filter((evento): evento is EventoBitacora =>
    typeof evento.id === 'string' &&
    typeof evento.tipo === 'string' &&
    typeof evento.timestamp === 'string' &&
    typeof evento.descripcion === 'string')
  if (eventos.length !== data.length) throw new Error('Uno o más eventos de la bitácora no cumplen el contrato OpenAPI.')
  return eventos
}

// --- Índice de Cumplimiento (M6, RF020-RF025) — prometido vs. real, público sin auth ---
export async function obtenerIndiceCumplimientoGlobal(): Promise<IndiceCumplimiento> {
  const { data } = await apiClient.get<IndiceCumplimiento>('/cumplimiento')
  return data
}

/** Índice de un corte puntual — solo tiene sentido una vez cerrado (409 si sigue abierto). */
export async function obtenerIndiceCumplimientoPorCorte(corteId: string): Promise<IndiceCumplimiento> {
  const { data } = await apiClient.get<IndiceCumplimiento>(`/cumplimiento/cortes/${encodeURIComponent(corteId)}`)
  return data
}

export async function obtenerSerieCumplimiento(sectorId?: string): Promise<PuntoSerieCumplimiento[]> {
  const { data } = await apiClient.get<PuntoSerieCumplimiento[]>('/cumplimiento/serie', { params: sectorId ? { sectorId } : undefined })
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una serie de cumplimiento inválida.')
  return data
}

/** Índice agregado de un sector sobre sus cortes cerrados. 400 si todavía no tiene ninguno (RF022). */
export async function obtenerIndiceCumplimientoPorSector(sectorId: string): Promise<IndiceCumplimiento> {
  const { data } = await apiClient.get<IndiceCumplimiento>(`/cumplimiento/sectores/${encodeURIComponent(sectorId)}`)
  return data
}

/** URL absoluta de descarga — se usan en un <a href download>, no por axios (RF025). */
export function urlExportarEstadisticasCsv(): string {
  return `${apiClient.defaults.baseURL}/estadisticas/exportar.csv`
}

export function urlExportarCumplimientoCsv(sectorId?: string): string {
  const base = `${apiClient.defaults.baseURL}/cumplimiento/serie.csv`
  return sectorId ? `${base}?sectorId=${encodeURIComponent(sectorId)}` : base
}

// --- Cola de revisión de la ingesta automatizada (M9, ADR-028) ---
export interface PropuestaIngesta {
  id: string
  sectorId: string
  /** SIN_SERVICIO, PRESION_BAJA, CORTE_PROGRAMADO o CON_SERVICIO */
  estadoPropuesto: string
  /** Colector que la detectó, p. ej. "acuacar" */
  fuente: string
  urlOriginal: string | null
  /** Fragmento del que se dedujo el estado — lo que el veedor lee para decidir (ADR-028) */
  citaTextual: string
  /** Entre 0 y 1 */
  confianza: number
  detectadaEn: string
  /** PENDIENTE, APROBADA o DESCARTADA */
  estadoRevision: string
}

/** Misma lógica que {@link listarReportesPendientes}: la cola completa de una vez, con el total real. */
export async function listarPropuestasIngesta(): Promise<ListaConTotal<PropuestaIngesta>> {
  const { data, headers } = await apiClient.get<PropuestaIngesta[]>('/veedor/ingesta/propuestas', {
    params: { tamano: TAMANO_MAXIMO_COLA },
  })
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una cola de ingesta inválida.')
  return { items: data, totalCount: totalDesdeCabecera(headers, data.length) }
}

export async function aprobarPropuestaIngesta(id: string): Promise<PropuestaIngesta> {
  const { data } = await apiClient.patch<PropuestaIngesta>(`/veedor/ingesta/propuestas/${encodeURIComponent(id)}/aprobar`)
  return data
}

export async function descartarPropuestaIngesta(id: string): Promise<PropuestaIngesta> {
  const { data } = await apiClient.patch<PropuestaIngesta>(`/veedor/ingesta/propuestas/${encodeURIComponent(id)}/descartar`)
  return data
}

export interface SaludColector {
  nombre: string
  ultimaEjecucionExitosa: string | null
  ultimoFallo: string | null
  motivoDelUltimoFallo: string | null
  itemsProcesados: number
  tasaDeError: number
  fallosConsecutivos: number
}

export async function obtenerSaludIngesta(): Promise<SaludColector[]> {
  const { data } = await apiClient.get<SaludColector[]>('/veedor/ingesta/salud')
  if (!Array.isArray(data)) throw new Error('El servidor devolvió un estado de salud inválido.')
  return data
}
