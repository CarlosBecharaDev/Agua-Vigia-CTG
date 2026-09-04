import type { FC } from 'react'
import { BellRing, Sparkles } from 'lucide-react'
import logoAguaVigia from '../assets/logo-aguavigia-animado.webp'

interface Props {
  onSuscribirse: () => void
}

export const PanelProyecto: FC<Props> = ({ onSuscribirse }) => (
  <div className="panel-proyecto">
    <div className="panel-proyecto-card">
      <div className="panel-proyecto-marca">
        <img
          className="panel-proyecto-logo"
          src={logoAguaVigia}
          alt="AguaVigía CTG"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
        <div className="panel-proyecto-eyebrow">
          <span className="pulse-dot-cyan" />
          <span>VEEDURÍA CIUDADANA EN VIVO</span>
        </div>
      </div>

      <div className="panel-proyecto-cuerpo">
        <h1 className="panel-proyecto-titulo">
          AGUA <span className="panel-proyecto-titulo-acento">VIGÍA</span>
        </h1>
        <p className="panel-proyecto-slogan">Cartagena, vigilada por su gente</p>
        <p className="panel-proyecto-copy">
          Monitoreo ciudadano independiente: contrastamos los boletines oficiales con lo que reportan tus vecinos en tiempo real.
        </p>

        <div className="panel-proyecto-suscripcion">
          <div className="panel-proyecto-beneficio">
            <Sparkles size={14} color="#54c6ca" />
            <span>Alertas tempranas de cortes y bajas presiones</span>
          </div>
          <button
            type="button"
            onClick={onSuscribirse}
            className="panel-proyecto-boton hover-glowing"
            aria-label="Suscríbete para recibir avisos de tu barrio"
          >
            <BellRing size={16} aria-hidden="true" />
            <span>Suscríbete a tu barrio</span>
          </button>
        </div>
      </div>
    </div>
  </div>
)

