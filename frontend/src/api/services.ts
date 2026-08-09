import type { components } from './generated/schema'
import { apiClient, sesionVeedor } from './client'

type SectorApi = components['schemas']['SectorRespuesta']
type RespuestaSectoresApi = components['schemas']['RespuestaSectores']
export type SolicitudSuscripcion = Required<components['schemas']['SolicitudSuscripcion']>
export type SuscripcionRespuesta = components['schemas']['SuscripcionRespuesta']
type SolicitudReporteApi = components['schemas']['SolicitudReporte']
export type SolicitudReporte = Required<Pick<SolicitudReporteApi, 'sectorId' | 'tipo' | 'huella'>> &
  Pick<SolicitudReporteApi, 'coordenada'>
export type ReporteRespuesta = components['schemas']['ReporteRespuesta']
type ReporteModeracionApi = components['schemas']['ReporteModeracionRespuesta']
export type ReporteModeracion = Required<Pick<ReporteModeracionApi, 'id' | 'sectorId' | 'tipo' | 'timestamp' | 'estadoModeracion'>> &
  Pick<ReporteModeracionApi, 'coordenada'>
type SolicitudCorteApi = components['schemas']['SolicitudCorte']
export type SolicitudCorte = Required<Pick<SolicitudCorteApi, 'sectoresAfectados' | 'inicio' | 'finPrometido' | 'causa'>>
export type CorteOficial = components['schemas']['CorteRespuesta']

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
