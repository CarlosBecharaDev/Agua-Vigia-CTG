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
 * Un barrio sin corte anunciado por Acuacar ni reporte ciudadano vigente se muestra **con
 * servicio** (`ADR-035`). No es una suposición sobre un vacío: desde `ADR-034` el colector revisa
 * los boletines del operador cada 10 minutos sobre una ventana de 7 días y publica solo, así que la
 * ausencia de aviso es una señal que se mantiene, no la falta de un sistema. Ese es el supuesto que
 * `ADR-014` no podía tener el 2026-08-08, cuando no había ingesta y los 211 barrios estaban sin dato.
 *
 * Se mantiene como constante aparte —y no se reemplaza por `COLOR_POR_ESTADO.CON_SERVICIO`— porque
 * el camino sigue siendo distinto: aquí el backend mandó `estado: null`, y por eso `actualizadoEn`
 * queda nulo y `useFrescura` dice "sin datos" en vez de inventar una hora de verificación. Fabricar
 * esa hora fue exactamente `BUG-061` (S1); pintar el barrio de verde no lo era.
 */
export const COLOR_SIN_DATOS = { claro: '#34c759', oscuro: '#4FBF89', etiqueta: 'Con servicio' }

/** Cuántos minutos antes de que un dato se considere "fresco" */
export const MINUTOS_FRESCURA = 15
