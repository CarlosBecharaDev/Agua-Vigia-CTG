/**
 * TarjetasEstadoMapa — la escala de sondas de la carta.
 *
 * Una fila por estado del servicio, leída como la escala de profundidades que acompaña a
 * una carta náutica: el rótulo, la cifra y nada más. "Ver en el mapa" no navega — le pasa
 * el estado a MapaCartagena vía estadoDestacado, que atenúa el resto y encuadra el zoom
 * (ver dibujarDestacado en MapaCartagena.tsx). Volver a tocar la misma fila apaga el foco.
 *
 * La fila de "sin sondar" es la razón de que este componente se rehiciera. Antes había
 * cuatro tarjetas y, con la base recién sembrada, las cuatro decían 0 — la pantalla
 * afirmaba, sin decirlo, que en Cartagena no pasa nada. Lo que pasaba es que nadie había
 * verificado nada todavía, y ese es un dato que el producto tiene la obligación de
 * mostrar: es el que explica todos los demás (ADR-014). Va de último y con el tramado de
 * zona sin sondar, no con un color de estado, porque no es un estado: es su ausencia.
 */
import type { CSSProperties, FC } from 'react'
import type { EstadoServicio } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'

interface Props {
  resumen: { estado: EstadoServicio; n: number }[]
  /** Barrios sin ningún dato verificado — el complemento de resumen sobre el total. */
  sinSondar: number
  estadoDestacado: EstadoServicio | null
  onAlternar: (estado: EstadoServicio) => void
}

export const TarjetasEstadoMapa: FC<Props> = ({
  resumen,
  sinSondar,
  estadoDestacado,
  onAlternar,
}) => (
  <div
    className="escala-sondas"
    role="group"
    aria-label="Barrios por estado del servicio, con acceso rápido al mapa"
  >
    {resumen.map(({ estado, n }) => {
      const { claro: color, etiqueta } = COLOR_POR_ESTADO[estado]
      const activa = estadoDestacado === estado
      return (
        <button
          key={estado}
          type="button"
          className={`sonda-fila${activa ? ' is-activa' : ''}`}
          style={{ '--color-estado': color } as CSSProperties}
          disabled={n === 0}
          aria-pressed={activa}
          onClick={() => onAlternar(estado)}
        >
          <span className="sonda-fila-marca" aria-hidden="true" />
          <span className="sonda-fila-etiqueta">{etiqueta}</span>
          <span className="sonda sonda-fila-cifra">{n}</span>
        </button>
      )
    })}

    {/* No es un botón: no hay nada que encuadrar en el mapa, y fingir que se puede
        "filtrar por lo que no sabemos" sería justo la clase de afirmación vacía que el
        resto del producto evita. Es una lectura, y se comporta como tal. */}
    <div className="sonda-fila sonda-fila--sin-sondar">
      <span className="sonda-fila-marca zona-sin-sondar" aria-hidden="true" />
      <span className="sonda-fila-etiqueta">Sin sondar</span>
      <span className="sonda sonda-fila-cifra">{sinSondar}</span>
    </div>
  </div>
)
