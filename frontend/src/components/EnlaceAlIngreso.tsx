import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  /** Dentro del modal se vuelve cambiando de vista; en la ruta suelta, navegando a `/veedor`. */
  onVolver?: () => void
  children: ReactNode
}

/**
 * El mismo enlace se comporta distinto según dónde viva: navegar a `/veedor` desde el modal sacaría
 * al usuario de la portada para pedirle exactamente lo que ya tenía delante.
 */
export function EnlaceAlIngreso({ onVolver, children }: Props) {
  if (onVolver) {
    return (
      <button type="button" className="enlace-cuenta" onClick={onVolver}>
        {children}
      </button>
    )
  }
  return (
    <Link to="/veedor" className="enlace-cuenta">
      {children}
    </Link>
  )
}
