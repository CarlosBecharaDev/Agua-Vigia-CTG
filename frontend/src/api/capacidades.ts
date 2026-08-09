export const CAPACIDADES = {
  sectores: true,
  suscripciones: true,
  sesionVeedor: true,
  reportes: true,
  estadisticas: false,
  bitacora: false,
  moderacion: false,
  cortesOficiales: false,
  fuentesExternas: false,
} as const

export type Capacidad = keyof typeof CAPACIDADES

export function capacidadDisponible(capacidad: Capacidad): boolean {
  return CAPACIDADES[capacidad]
}
