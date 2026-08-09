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
    className="selector-tema"
  >
    <span className="selector-tema-icono" aria-hidden="true">
      {temaActivo === 'claro' ? <Sun size={18} color="var(--color-acento)" /> : <Moon size={18} color="var(--color-acento)" />}
    </span>
    <span aria-hidden="true" className="selector-tema-texto">
      {temaActivo === 'claro' ? 'Claro' : 'Oscuro'}
    </span>
  </button>
)
