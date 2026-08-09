import type { Sector } from '../types/tipos-dominio'
import { normalizarNombreBarrio } from './geografia'

export function sectorDesdeGeojson(nombre: string, sector?: Sector): Sector {
  return sector ?? {
    id: `geo-${normalizarNombreBarrio(nombre)}`,
    nombre,
    estado: null,
    actualizadoEn: null,
  }
}
