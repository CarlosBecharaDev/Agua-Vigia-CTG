import type { EventoBitacora } from '../api/services'
import type { Sector } from '../types/tipos-dominio'
import { normalizarNombreBarrio } from './geografia'

export const DIAS_VIGENCIA_PUBLICA = 30
const VIGENCIA_MS = DIAS_VIGENCIA_PUBLICA * 24 * 60 * 60 * 1000

function fechaValidaDentroDeVentana(fechaIso: string | null | undefined, ahora: number): boolean {
  if (!fechaIso) return false
  const fecha = Date.parse(fechaIso)
  return Number.isFinite(fecha) && fecha <= ahora && ahora - fecha <= VIGENCIA_MS
}

/** Un estado viejo conserva su barrio y su geometría, pero deja de presentarse como actual. */
export function invalidarEstadoVencido(sector: Sector, ahora = Date.now()): Sector {
  if (!sector.estado || fechaValidaDentroDeVentana(sector.actualizadoEn, ahora)) return sector
  return { ...sector, estado: null }
}

export function filtrarEventosRecientes(eventos: EventoBitacora[], ahora = Date.now()): EventoBitacora[] {
  return eventos.filter((evento) => fechaValidaDentroDeVentana(evento.timestamp, ahora))
}

/** Completa la lista de la API con la cartografía pública: un barrio ausente queda «sin datos». */
export function completarCatalogoBarrios(sectores: Sector[], nombres: string[]): Sector[] {
  const porNombre = new Map(sectores.map((sector) => [normalizarNombreBarrio(sector.nombre), sector]))
  const resultado = nombres.map((nombre) => porNombre.get(normalizarNombreBarrio(nombre)) ?? {
    id: `geo-${normalizarNombreBarrio(nombre).replace(/[^a-z0-9]+/g, '-')}`,
    nombre,
    estado: null,
    actualizadoEn: null,
  })
  const nombresCartografia = new Set(nombres.map(normalizarNombreBarrio))
  return [
    ...resultado,
    ...sectores.filter((sector) => !nombresCartografia.has(normalizarNombreBarrio(sector.nombre))),
  ]
}
