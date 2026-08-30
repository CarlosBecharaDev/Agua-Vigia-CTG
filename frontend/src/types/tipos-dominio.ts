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

/** Un sector con su estado — forma mínima que necesita el mapa.
 *  `estado`/`actualizadoEn` pueden ser null: el backend crea sectores desde el GeoJSON de
 *  barrios sin que nadie los haya reportado o verificado todavía (ver COLOR_SIN_DATOS). */
export interface Sector {
  id: string
  nombre: string
  estado: EstadoServicio | null
  /** Timestamp ISO de la última actualización del estado */
  actualizadoEn: string | null
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

/**
 * Un barrio del que nadie ha reportado nada. Verde pálido, no gris: 211 barrios grises hacían ver
 * el mapa averiado en vez de prudente. Pero es un verde **distinto** del de CON_SERVICIO a
 * propósito — la ausencia de reportes no es evidencia de que haya agua, y pintarlos con el mismo
 * verde afirmaría un "todo despejado" que nadie verificó, justo lo que prohíbe la regla 4 de ética
 * de datos. La etiqueta dice lo que el dato es —"sin reportes"— y no lo que se supone de él.
 */
export const COLOR_SIN_DATOS = { claro: '#9FD8AB', oscuro: '#5E8F72', etiqueta: 'Sin reportes de falla' }

/** Cuántos minutos antes de que un dato se considere "fresco" */
export const MINUTOS_FRESCURA = 15
