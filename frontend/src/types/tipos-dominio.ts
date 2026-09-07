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

/**
 * Mapa de colores por estado — DESIGN.md §2, con los valores que además pasan el contraste AA
 * que §7 exige. Deben coincidir exactamente con `--color-estado-*` de `index.css`: el mapa pinta
 * los polígonos desde aquí y la leyenda desde el CSS, así que si divergen el vecino ve un verde
 * en el mapa y otro en la leyenda para el mismo estado, y el color deja de significar algo
 * (`ADR-042`).
 */
export const COLOR_POR_ESTADO: Record<EstadoServicio, { claro: string; oscuro: string; etiqueta: string }> = {
  CON_SERVICIO:     { claro: '#1C7F55', oscuro: '#4FBF89', etiqueta: 'Con servicio' },
  SIN_SERVICIO:     { claro: '#AE3428', oscuro: '#E2695B', etiqueta: 'Sin servicio' },
  PRESION_BAJA:     { claro: '#94640C', oscuro: '#D9A63C', etiqueta: 'Presión baja' },
  CORTE_PROGRAMADO: { claro: '#2A628F', oscuro: '#6BA8DA', etiqueta: 'Corte programado' },
}

/** Un estado ausente o vencido nunca se interpreta como servicio confirmado. */
export const COLOR_SIN_DATOS = { claro: '#65727D', oscuro: '#A8B3BC', etiqueta: 'Sin datos recientes' }

/** Cuántos minutos antes de que un dato se considere "fresco" */
export const MINUTOS_FRESCURA = 15
