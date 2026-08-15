/**
 * Cartela — el bloque de título de la carta, arriba a la izquierda del mapa.
 *
 * Toda carta náutica lleva una cartela: un recuadro que declara qué carta es, a qué
 * escala, sobre qué datum está referida y cuándo se levantó. No es decoración — es lo
 * que te deja saber cuánto puedes fiarte de lo que estás mirando. Aquí cumple
 * exactamente esa función y por eso reemplazó al hero anterior: en vez de un panel que
 * vendía el proyecto por encima del mapa, un bloque que declara su procedencia.
 *
 * El "datum" de esta carta son los reportes verificados por consenso vecinal. Decirlo
 * en la cartela es la forma más corta de cumplir el principio del proyecto: nada se
 * publica sin poder sustentarlo (ADR-014, ADR-028).
 *
 * Sustituye a PanelProyecto, que traía el logo animado de 400 KB, dos StrokeText sobre
 * GSAP y un shader WebGL de fondo con la paleta violeta/rosa por defecto de la librería
 * de donde se copió — nada de eso salía del proyecto ni sobrevivía a la pregunta de qué
 * le aporta a alguien que solo quiere saber si le va a llegar el agua.
 */
import type { FC } from 'react'
import { BellRing } from 'lucide-react'

interface Props {
  /** Barrios en la carta. Es el universo completo, tengan dato o no. */
  totalBarrios: number
  /** Barrios con estado verificado. El resto son zona sin sondar. */
  barriosSondados: number
  /** Texto ya formateado de la última actualización ("hace 2 minutos"). */
  ultimaActualizacion: string
  onSuscribirse: () => void
}

export const Cartela: FC<Props> = ({
  totalBarrios,
  barriosSondados,
  ultimaActualizacion,
  onSuscribirse,
}) => (
  <div className="cartela">
    <p className="rotulo-carta cartela-rotulo">Carta del servicio de agua</p>

    <h1 className="cartela-titulo">
      Cartagena
      <span className="cartela-titulo-de">de Indias</span>
    </h1>

    {/* La itálica no es énfasis: en cartografía náutica lo hidrográfico va en itálica.
        Es la única línea de la cartela que habla del agua misma. */}
    <p className="rotulo-hidrografico cartela-lema">Levantada por sus vecinos</p>

    {/* Las tres declaraciones de una cartela real. La del datum es la que importa:
        dice de dónde sale el dato antes de que nadie lo lea en el mapa. */}
    <dl className="cartela-datos">
      <div>
        <dt>Barrios</dt>
        <dd className="sonda">{totalBarrios}</dd>
      </div>
      <div>
        <dt>Sondados</dt>
        <dd className="sonda">
          {barriosSondados}
          <span className="cartela-dato-de">/{totalBarrios}</span>
        </dd>
      </div>
      <div>
        <dt>Datum</dt>
        <dd className="cartela-datum">Reportes verificados</dd>
      </div>
    </dl>

    <p className="cartela-correccion">
      Última corrección: <span className="sonda">{ultimaActualizacion}</span>
    </p>

    <button type="button" onClick={onSuscribirse} className="cartela-boton">
      <BellRing size={15} aria-hidden="true" />
      Avísame de mi barrio
    </button>
  </div>
)
