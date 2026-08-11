/**
 * TarjetasEstadoMapa — reemplaza la lista .mapa-conteos y la barra flotante del mapa
 * (.mapa-overlay-top): 4 tarjetas, una por estado, con acento neón del color de su estado
 * (COLOR_POR_ESTADO). "Ver en el mapa" no navega a ningún lado — le pasa el estado a
 * MapaCartagena vía estadoDestacado, que se encarga de atenuar el resto, encuadrar el zoom
 * y dibujar la línea + los "pings" con el nombre de cada barrio (ver dibujarDestacado en
 * MapaCartagena.tsx). Volver a tocar la misma tarjeta apaga el foco (comportamiento toggle).
 */
import type { CSSProperties, FC } from 'react'
import type { EstadoServicio } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'

interface Props {
  resumen: { estado: EstadoServicio; n: number }[]
  estadoDestacado: EstadoServicio | null
  onAlternar: (estado: EstadoServicio) => void
}

export const TarjetasEstadoMapa: FC<Props> = ({ resumen, estadoDestacado, onAlternar }) => (
  <div
    className="tarjetas-estado-mapa"
    role="group"
    aria-label="Resumen de sectores por estado, con acceso rápido al mapa"
  >
    {resumen.map(({ estado, n }) => {
      const { claro: color, etiqueta } = COLOR_POR_ESTADO[estado]
      const activa = estadoDestacado === estado
      return (
        <div
          key={estado}
          className={`tarjeta-estado-mapa${activa ? ' is-activa' : ''}`}
          style={{ '--color-neon': color } as CSSProperties}
        >
          <div className="tarjeta-estado-mapa-cab">
            <span className="tarjeta-estado-mapa-punto" aria-hidden="true" />
            <span className="tarjeta-estado-mapa-etiqueta">{etiqueta}</span>
          </div>
          <strong className="tarjeta-estado-mapa-num tabular">{n}</strong>
          <span className="tarjeta-estado-mapa-sub">{n === 1 ? 'barrio' : 'barrios'}</span>
          <button
            type="button"
            className="tarjeta-estado-mapa-btn"
            disabled={n === 0}
            aria-pressed={activa}
            onClick={() => onAlternar(estado)}
          >
            {activa ? 'Ocultar del mapa' : 'Ver en el mapa'}
          </button>
        </div>
      )
    })}
  </div>
)
