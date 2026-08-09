export const CAPACIDADES = {
  sectores: true,
  suscripciones: true,
  sesionVeedor: true,
  reportes: true,
  estadisticas: true,
  bitacora: true,
  moderacion: true,
  cortesOficiales: true,
  fuentesExternas: false,
} as const

export type Capacidad = keyof typeof CAPACIDADES

export function capacidadDisponible(capacidad: Capacidad): boolean {
  return CAPACIDADES[capacidad]
}
