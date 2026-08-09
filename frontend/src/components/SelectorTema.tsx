/**
 * SelectorTema — botón accesible para alternar entre claro y oscuro.
 *
 * - Objetivo táctil ≥ 44×44px (DESIGN.md §7).
 * - Label para lector de pantalla actualiza con el tema activo.
 * - Icono acompañado de texto en pantallas ≥ sm (el color nunca va solo).
 */
import type { FC } from 'react'
import { Sun, Moon } from 'lucide-react'

interface Props {
  temaActivo: 'claro' | 'oscuro'
  onAlternar: () => void
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
    className="hover-highlight-text"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.4rem 0.75rem',
      border: '1px solid var(--color-linea)',
      borderRadius: 'var(--radio-pill)',
      backgroundColor: 'var(--color-superficie)',
      color: 'var(--color-tinta)',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.3s ease',
      minHeight: '40px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
      transform: temaActivo === 'claro' ? 'rotate(0deg)' : 'rotate(180deg) scale(0.8)',
    }}>
      {temaActivo === 'claro' ? <Sun size={18} color="var(--color-acento)" /> : <Moon size={18} color="var(--color-acento)" />}
    </div>
    <span aria-hidden="true" style={{ minWidth: '55px', textAlign: 'center', paddingRight: '0.25rem' }}>
      {temaActivo === 'claro' ? 'Claro' : 'Oscuro'}
    </span>
  </button>
)
