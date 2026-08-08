/**
 * EtiquetaFrescura — muestra "actualizado hace X min" y advierte si el dato está degradado.
 *
 * DESIGN.md §6: "Si una fuente lleva horas muda, se marca como degradada.
 * Un mapa congelado mostrando datos viejos como actuales es peor que
 * un mapa que admite que no sabe."
 */
import type { FC } from 'react'
import { useFrescura } from '../hooks/useFrescura'

interface Props {
  timestampIso: string | null
}

export const EtiquetaFrescura: FC<Props> = ({ timestampIso }) => {
  const { etiqueta, degradado } = useFrescura(timestampIso)

  return (
    <span
      aria-live="polite"
      aria-label={degradado ? `Dato posiblemente desactualizado: ${etiqueta}` : etiqueta}
      style={{
        fontSize: '0.75rem',
        fontFamily: 'var(--font-util)',
        color: degradado ? 'var(--color-estado-baja)' : 'var(--color-tinta-3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
      }}
    >
      {degradado && (
        <span aria-hidden="true" title="Dato posiblemente desactualizado">⚠️</span>
      )}
      {etiqueta}
    </span>
  )
}
