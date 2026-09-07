import type { FC } from 'react'
import type { EnlaceNav } from '../../config/navegacion'
import './NavegacionInferior.css'

interface Props {
  items: EnlaceNav[]
  activeIndex: number
  onSelect: (indice: number, href: string) => void
}

/** Navegación compacta para teléfono. El estado activo se comunica con texto, icono y línea. */
export const NavegacionInferior: FC<Props> = ({ items, activeIndex, onSelect }) => (
  <nav className="nav-inferior" aria-label="Secciones de la página">
    <ul className="nav-inferior-lista">
      {items.map((item, indice) => {
        const Icono = item.Icono
        const activa = indice === activeIndex
        return (
          <li key={item.a}>
            <button
              type="button"
              className={`nav-inferior-pestana${activa ? ' nav-inferior-pestana--activa' : ''}`}
              aria-current={activa ? 'page' : undefined}
              onClick={() => onSelect(indice, item.a)}
            >
              <span className="nav-inferior-icono" aria-hidden="true">
                <Icono size={18} />
              </span>
              <span className="nav-inferior-etiqueta">{item.etiqueta}</span>
            </button>
          </li>
        )
      })}
    </ul>
  </nav>
)
