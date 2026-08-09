/**
 * InsigniaEstado — pastilla visual que muestra el estado del servicio.
 *
 * DESIGN.md §2: "El color nunca va solo. Cada estado se acompaña
 * de forma o texto." Este componente siempre muestra el punto + etiqueta.
 */
import type { FC } from 'react'
import type { EstadoServicio } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'

interface Props {
  estado: EstadoServicio | null
  /** Si true usa la paleta oscura */
  modoOscuro?: boolean
  tamaño?: 'sm' | 'md'
}

export const InsigniaEstado: FC<Props> = ({ estado, modoOscuro = false, tamaño = 'md' }) => {
  const colores = estado ? COLOR_POR_ESTADO[estado] : COLOR_SIN_DATOS
  const color = modoOscuro ? colores.oscuro : colores.claro
  const fontSize = tamaño === 'sm' ? '0.75rem' : '0.875rem'
  const dotSize = tamaño === 'sm' ? '8px' : '10px'

  return (
    <span
      role="status"
      aria-label={`Estado: ${colores.etiqueta}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize,
        fontFamily: 'var(--font-util)',
        color: 'var(--color-tinta)',
        fontWeight: '500',
      }}
    >
      {/* Punto de color — nunca va solo, siempre acompañado por el texto */}
      <span
        aria-hidden="true"
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {colores.etiqueta}
    </span>
  )
}
