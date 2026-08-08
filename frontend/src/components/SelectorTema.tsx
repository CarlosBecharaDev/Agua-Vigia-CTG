/**
 * SelectorTema — botón accesible para alternar entre claro y oscuro.
 *
 * - Objetivo táctil ≥ 44×44px (DESIGN.md §7).
 * - Label para lector de pantalla actualiza con el tema activo.
 * - Icono acompañado de texto en pantallas ≥ sm (el color nunca va solo).
 */
import type { FC } from 'react'

interface Props {
  temaActivo: 'claro' | 'oscuro'
  onAlternar: () => void
}

const ICONO: Record<'claro' | 'oscuro', string> = {
  claro:  '☀️',
  oscuro: '🌙',
}

const LABEL_SR: Record<'claro' | 'oscuro', string> = {
  claro:  'Cambiar a modo oscuro',
  oscuro: 'Cambiar a modo claro',
}

export const SelectorTema: FC<Props> = ({ temaActivo, onAlternar }) => (
  <button
    id="btn-selector-tema"
    type="button"
    aria-label={LABEL_SR[temaActivo]}
    onClick={onAlternar}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.5rem 0.75rem',
      border: '1px solid var(--color-linea)',
      borderRadius: 'var(--radio-base)',
      background: 'transparent',
      color: 'var(--color-tinta)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontFamily: 'var(--font-cuerpo)',
      transition: 'background-color var(--transicion), border-color var(--transicion)',
      minHeight: '44px',
      minWidth: '44px',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-fondo)'
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
    }}
  >
    <span aria-hidden="true">{ICONO[temaActivo]}</span>
    <span className="uppercase-label" aria-hidden="true">
      {temaActivo === 'claro' ? 'Claro' : 'Oscuro'}
    </span>
  </button>
)
