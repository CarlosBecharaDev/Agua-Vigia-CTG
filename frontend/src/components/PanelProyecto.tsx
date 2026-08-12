/**
 * PanelProyecto — bloque a la izquierda del hero (agua abierta), en la página principal.
 * Arriba, el logo animado + nombre; abajo, centrado, el proyecto en una frase y la
 * suscripción a los avisos del propio barrio — abre ModalSuscripcion con el
 * FormularioSuscripcion real (POST /suscripciones), no una simulación.
 *
 * Sin `panel-glass` a propósito: el texto va directo sobre las olas, sin tarjeta ni
 * desenfoque detrás. Esa clase la comparte con `.hoja-sectores` (el panel dentro del marco
 * del mapa), que sí la necesita — por eso se quita aquí la clase en vez de tocarla.
 */
import type { FC } from 'react'
import { BellRing } from 'lucide-react'
import StrokeText from './StrokeText/StrokeText'
// WebP animado y no GIF: la versión GIF pesaba 4.5 MB (RNF001 medía 21 s de First Contentful
// Paint en 3G por su culpa) mostrada a 150px de ancho. Este WebP, a 200px de ancho, pesa ~400 KB
// — mismos 120 frames, misma transparencia — y sigue siendo un <img> normal.
import logoAguaVigia from '../assets/logo-aguavigia-animado.webp'

interface Props {
  onSuscribirse: () => void
}

export const PanelProyecto: FC<Props> = ({ onSuscribirse }) => (
  <div className="panel-proyecto">
    <div className="panel-proyecto-marca">
      <img className="panel-proyecto-logo" src={logoAguaVigia} alt="" aria-hidden="true" />
    </div>

    <div className="panel-proyecto-cuerpo">
      {/* Dos StrokeText, uno por palabra, porque cada una lleva su color. El role/aria-label
          va en el contenedor y los hijos se ocultan al lector de pantalla: si no, cada
          instancia anuncia su propio role="img" y la marca se leería partida en dos.
          Ambas comparten trigger y loopEvery, así que arrancan juntas y no se desfasan. */}
      <div className="panel-proyecto-marca-texto" role="img" aria-label="AguaVigía">
        <span aria-hidden="true">
          <StrokeText
            text="AGUA"
            strokeColor="#7dc8f7"
            fillColor="#7dc8f7"
            fontSize={54}
            letterSpacing={1}
            strokeWidth={1.2}
            trigger="loop"
            loopEvery={15}
          />
        </span>
        <span aria-hidden="true">
          <StrokeText
            text="VIGÍA"
            strokeColor="#ffffff"
            fillColor="#ffffff"
            fontSize={54}
            letterSpacing={1}
            strokeWidth={1.2}
            trigger="loop"
            loopEvery={15}
          />
        </span>
      </div>
      <h2 className="panel-proyecto-titulo">Cartagena, vigilada por su gente</h2>
      <p className="panel-proyecto-copy">
        Cruzamos los avisos oficiales de Acuacar con lo que reportan tus vecinos, para que la
        brecha entre lo prometido y lo real quede a la vista de todos.
      </p>
      <div className="panel-proyecto-suscripcion">
        <p>¿Quieres enterarte apenas haya novedades en tu barrio?</p>
        <button onClick={onSuscribirse} className="panel-proyecto-boton hover-glowing">
          <BellRing size={16} aria-hidden="true" /> Suscríbete ahora
        </button>
      </div>
    </div>
  </div>
)
