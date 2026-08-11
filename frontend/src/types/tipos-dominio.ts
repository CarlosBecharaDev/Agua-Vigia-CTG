/**
 * tipos-dominio.ts — Tipos del dominio para el frontend.
 *
 * Derivados del modelo de dominio de D2 (docs/ingenieria/modelo-de-dominio.md).
 * NO son el contrato de la API — eso viene de openapi.yaml cuando C2 abra.
 * Sirven para tipar el estado local del mapa y los componentes estáticos.
 */

/** Los 4 estados del servicio — fuente única: DESIGN.md §2 y modelo-de-dominio.md §1 */
export type EstadoServicio =
  | 'CON_SERVICIO'
  | 'SIN_SERVICIO'
  | 'PRESION_BAJA'
  | 'CORTE_PROGRAMADO'

/** Un sector con su estado — forma mínima que necesita el mapa */
export interface Sector {
  id: string
  nombre: string
  estado: EstadoServicio
  /** Timestamp ISO de la última actualización del estado */
  actualizadoEn: string
}

/** Resultado de GET /api/sectores — forma esperada cuando C2 abra */
export interface RespuestaSectores {
  sectores: Sector[]
  generadoEn: string
}

/** Mapa de colores por estado — derivado de DESIGN.md §2 */
export const COLOR_POR_ESTADO: Record<EstadoServicio, { claro: string; oscuro: string; etiqueta: string }> = {
  CON_SERVICIO:     { claro: '#34c759', oscuro: '#4FBF89', etiqueta: 'Con servicio' },
  SIN_SERVICIO:     { claro: '#AE3428', oscuro: '#E2695B', etiqueta: 'Sin servicio' },
  PRESION_BAJA:     { claro: '#A87310', oscuro: '#D9A63C', etiqueta: 'Presión baja' },
  CORTE_PROGRAMADO: { claro: '#2A628F', oscuro: '#6BA8DA', etiqueta: 'Corte programado' },
}

/** Cuántos minutos antes de que un dato se considere "fresco" */
export const MINUTOS_FRESCURA = 15
