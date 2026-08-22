import type { components } from './generated/schema'
import { apiClient, sesionVeedor } from './client'
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
export type TipoEventoBitacora = 'CORTE_ANUNCIADO' | 'CORTE_CONFIRMADO_POR_CIUDADANOS' | 'CORTE_RESTABLECIDO'
export type EventoBitacora = Required<Pick<EventoBitacoraApi, 'id' | 'tipo' | 'timestamp' | 'descripcion'>> &
  Pick<EventoBitacoraApi, 'sectorId' | 'corteId'>

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

export async function iniciarSesionVeedor(clave: string): Promise<void> {
  const { data } = await apiClient.post<unknown>('/veedor/sesion', { clave })
  if (!data || typeof data !== 'object' || !('token' in data) || typeof data.token !== 'string') {
    throw new Error('El servidor no devolvió una sesión válida.')
  }
  sesionVeedor.guardar(data.token)
}

export function cerrarSesionVeedor() {
  sesionVeedor.limpiar()
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
