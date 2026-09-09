/**
 * TarjetasEstadoMapa — reemplaza la lista .mapa-conteos y la barra flotante del mapa
 * (.mapa-overlay-top): 4 tarjetas, una por estado, con acento neón del color de su estado
 * (COLOR_POR_ESTADO). "Ver en el mapa" no navega a ningún lado — le pasa el estado a
 * MapaCartagena vía estadoDestacado, que se encarga de atenuar el resto, encuadrar el zoom
 * y dibujar la línea + los "pings" con el nombre de cada barrio (ver dibujarDestacado en
 * MapaCartagena.tsx). Volver a tocar la misma tarjeta apaga el foco (comportamiento toggle).
 */
import type { CSSProperties, FC } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CalendarClock, CircleCheckBig, Gauge, DropletOff } from 'lucide-react'
import type { EstadoServicio } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'

interface Props {
  resumen: { estado: EstadoServicio; n: number }[]
  estadoDestacado: EstadoServicio | null
  onAlternar: (estado: EstadoServicio) => void
  temaActivo: 'claro' | 'oscuro'
  datosDisponibles: boolean
}

const detallePorEstado = (estado: EstadoServicio): string => {
  switch (estado) {
    case 'SIN_SERVICIO':
      return 'Barrios afectados'
    case 'PRESION_BAJA':
      return 'Barrios reportando'
    case 'CORTE_PROGRAMADO':
      return 'Mantenimientos hoy'
    case 'CON_SERVICIO':
      return 'Sectores estables'
  }
}

const ICONO_POR_ESTADO: Record<EstadoServicio, LucideIcon> = {
  SIN_SERVICIO: DropletOff,
  PRESION_BAJA: Gauge,
  CORTE_PROGRAMADO: CalendarClock,
  CON_SERVICIO: CircleCheckBig,
}

export const TarjetasEstadoMapa: FC<Props> = ({ resumen, estadoDestacado, onAlternar, temaActivo, datosDisponibles }) => (
  <div
    className="tarjetas-estado-mapa"
    role="group"
    aria-label="Resumen de sectores por estado, con acceso rápido al mapa"
  >
    {resumen.map(({ estado, n }) => {
      const paleta = COLOR_POR_ESTADO[estado]
      const color = temaActivo === 'oscuro' ? paleta.oscuro : paleta.claro
      const { etiqueta } = paleta
      const activa = estadoDestacado === estado
      const IconoEstado = ICONO_POR_ESTADO[estado]
      return (
        <div
          key={estado}
          className={`tarjeta-estado-mapa${activa ? ' is-activa' : ''}`}
          data-estado={estado}
          style={{ '--color-neon': color } as CSSProperties}
        >
          <div className="tarjeta-estado-mapa-cab">
            <span className="tarjeta-estado-mapa-icono" aria-hidden="true">
              <IconoEstado size={15} strokeWidth={2.25} />
            </span>
            <span className="tarjeta-estado-mapa-etiqueta">
              <span className="tarjeta-estado-mapa-punto" aria-hidden="true" />
              {etiqueta}
            </span>
          </div>
          <div className="tarjeta-estado-mapa-lectura">
            <strong className="tarjeta-estado-mapa-num tabular">{datosDisponibles ? n : '—'}</strong>
            <span className="tarjeta-estado-mapa-sub">
              {datosDisponibles ? detallePorEstado(estado) : 'Esperando datos validados'}
            </span>
          </div>
          <button
            type="button"
            className="tarjeta-estado-mapa-btn"
            disabled={!datosDisponibles || n === 0}
            aria-pressed={activa}
            onClick={() => onAlternar(estado)}
          >
            {activa ? 'Ocultar del mapa' : 'Ver en el mapa →'}
          </button>
        </div>
      )
    })}
  </div>
)
