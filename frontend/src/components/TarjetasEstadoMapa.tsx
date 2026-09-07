/**
 * TarjetasEstadoMapa — reemplaza la lista .mapa-conteos y la barra flotante del mapa
 * (.mapa-overlay-top): 4 tarjetas, una por estado, con acento neón del color de su estado
 * (COLOR_POR_ESTADO). "Ver en el mapa" no navega a ningún lado — le pasa el estado a
 * MapaCartagena vía estadoDestacado, que se encarga de atenuar el resto, encuadrar el zoom
 * y dibujar la línea + los "pings" con el nombre de cada barrio (ver dibujarDestacado en
 * MapaCartagena.tsx). Volver a tocar la misma tarjeta apaga el foco (comportamiento toggle).
 */
import type { CSSProperties, FC } from 'react'
import { ArrowRight } from 'lucide-react'
import type { EstadoServicio } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'

interface Props {
  resumen: { estado: EstadoServicio; n: number }[]
  estadoDestacado: EstadoServicio | null
  onAlternar: (estado: EstadoServicio) => void
  onAlternarBitacora?: () => void
}

const SUBTITULO_POR_ESTADO: Record<EstadoServicio, string> = {
  SIN_SERVICIO: 'barrios afectados',
  PRESION_BAJA: 'con presión baja publicada',
  CORTE_PROGRAMADO: 'con corte programado',
  CON_SERVICIO: 'con servicio confirmado',
}

export const TarjetasEstadoMapa: FC<Props> = ({
  resumen,
  estadoDestacado,
  onAlternar,
  onAlternarBitacora,
}) => {
  return (
    <div
      className="tarjetas-estado-mapa-contenedor"
      role="group"
      aria-label="Resumen de sectores por estado, con acceso rápido al mapa"
    >
      <div className="tarjetas-estado-mapa">
        {resumen.map(({ estado, n }) => {
          const { claro: color, etiqueta } = COLOR_POR_ESTADO[estado]
          const activa = estadoDestacado === estado
          const claseModificador = `tarjeta-estado-mapa--${estado.toLowerCase().replace('_', '-')}`
          const esProgramados = estado === 'CORTE_PROGRAMADO'
          return (
            <div
              key={estado}
              className={`metric-card tarjeta-estado-mapa ${claseModificador}${activa ? ' is-activa' : ''}`}
              style={{ '--color-neon': color } as CSSProperties}
              onClick={() => {
                if (esProgramados && onAlternarBitacora) {
                  onAlternarBitacora()
                } else if (n > 0) {
                  onAlternar(estado)
                }
              }}
            >
              <div className="tarjeta-estado-mapa-cab">
                <span className="tarjeta-estado-mapa-punto" aria-hidden="true" />
                <span className="tarjeta-estado-mapa-etiqueta">{etiqueta}</span>
              </div>
              <div className="tarjeta-estado-mapa-cuerpo">
                <strong className="tarjeta-estado-mapa-num tabular">{n}</strong>
                <span className="tarjeta-estado-mapa-sub">{SUBTITULO_POR_ESTADO[estado]}</span>
              </div>
              <button
                type="button"
                className="tarjeta-estado-mapa-btn"
                disabled={n === 0 && !esProgramados}
                aria-pressed={activa}
                onClick={(e) => {
                  e.stopPropagation()
                  if (esProgramados && onAlternarBitacora) {
                    onAlternarBitacora()
                  } else {
                    onAlternar(estado)
                  }
                }}
              >
                <span>
                  {esProgramados
                    ? 'Ver cronograma'
                    : activa
                      ? 'Ocultar del mapa'
                      : estado === 'CON_SERVICIO'
                        ? 'Ver todos'
                        : 'Ver en el mapa'}
                </span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

    </div>
  )
}
