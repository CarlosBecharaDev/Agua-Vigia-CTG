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

// --- Estadísticas (M7) ---
export async function obtenerEstadisticas(): Promise<EstadisticasGlobales> {
  const { data } = await apiClient.get<EstadisticasGlobales>('/estadisticas')
  return data
}

export async function listarReportesPendientes(): Promise<ReporteModeracion[]> {
  const { data } = await apiClient.get<ReporteModeracionApi[]>('/veedor/reportes/pendientes')
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una cola de moderación inválida.')
  const reportes = data.filter((reporte): reporte is ReporteModeracion =>
    typeof reporte.id === 'string' &&
    typeof reporte.sectorId === 'string' &&
    typeof reporte.tipo === 'string' &&
    typeof reporte.timestamp === 'string' &&
    typeof reporte.estadoModeracion === 'string')
  if (reportes.length !== data.length) throw new Error('Uno o más reportes no cumplen el contrato OpenAPI.')
  return reportes
}

export async function moderarReporte(id: string, decision: 'aprobar' | 'descartar'): Promise<ReporteModeracionApi> {
  const { data } = await apiClient.patch<ReporteModeracionApi>(`/veedor/reportes/${encodeURIComponent(id)}/${decision}`)
  return data
}

export async function listarCortesPorSector(sectorId: string): Promise<CorteOficial[]> {
  const { data } = await apiClient.get<CorteOficial[]>('/veedor/cortes', { params: { sectorId } })
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

export async function obtenerSerieCumplimiento(sectorId?: string): Promise<PuntoSerieCumplimiento[]> {
  const { data } = await apiClient.get<PuntoSerieCumplimiento[]>('/cumplimiento/serie', { params: sectorId ? { sectorId } : undefined })
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una serie de cumplimiento inválida.')
  return data
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

export async function listarPropuestasIngesta(): Promise<PropuestaIngesta[]> {
  const { data } = await apiClient.get<PropuestaIngesta[]>('/veedor/ingesta/propuestas')
  if (!Array.isArray(data)) throw new Error('El servidor devolvió una cola de ingesta inválida.')
  return data
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
