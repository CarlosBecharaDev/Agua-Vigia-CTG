/**
 * tipos-dominio.ts — Tipos del dominio para el frontend.
 *
 * Derivados del modelo de dominio de D2 (docs/ingenieria/modelo-de-dominio.md).
 * NO son el contrato de la API — eso viene de openapi.yaml cuando C2 abra.
 * Sirven para tipar el estado local del mapa y los componentes estáticos.
 */

import type { components } from '../api/generated/schema'

type SectorContrato = components['schemas']['SectorRespuesta']

/** Los valores salen del contrato OpenAPI; la presentación sale de DESIGN.md. */
export type EstadoServicio = Exclude<SectorContrato['estado'], null | undefined>

/** Un sector con su estado — forma mínima que necesita el mapa */
export type Sector = Required<Pick<SectorContrato, 'id' | 'nombre'>> & {
  estado: EstadoServicio | null
  actualizadoEn: string | null
}

/** Resultado de GET /api/sectores — forma esperada cuando C2 abra */
export type RespuestaSectores = { sectores: Sector[]; generadoEn: string }

/** Mapa de colores por estado — derivado de DESIGN.md §2 */
export const COLOR_POR_ESTADO: Record<EstadoServicio, { claro: string; oscuro: string; etiqueta: string }> = {
  CON_SERVICIO:     { claro: '#1C7F55', oscuro: '#4FBF89', etiqueta: 'Con servicio' },
  SIN_SERVICIO:     { claro: '#AE3428', oscuro: '#E2695B', etiqueta: 'Sin servicio' },
  PRESION_BAJA:     { claro: '#A87310', oscuro: '#D9A63C', etiqueta: 'Presión baja' },
  CORTE_PROGRAMADO: { claro: '#2A628F', oscuro: '#6BA8DA', etiqueta: 'Corte programado' },
}

export const COLOR_SIN_DATOS = { claro: '#788290', oscuro: '#8B95A5', etiqueta: 'Sin datos (Pendiente verificación)' }

/** Cuántos minutos antes de que un dato se considere "fresco" */
export const MINUTOS_FRESCURA = 15
