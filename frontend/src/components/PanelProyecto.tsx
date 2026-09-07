import type { FC } from 'react'
import { Activity, BellRing, Database, Droplets } from 'lucide-react'
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
        <p className="panel-proyecto-eyebrow">Proyecto de aula con vocación pública</p>
      </div>

      <div className="panel-proyecto-cuerpo">
        <p className="panel-proyecto-kicker">Veeduría y Transparencia</p>
        <h2 className="panel-proyecto-titulo">Una lectura de ciudad construida desde cada barrio.</h2>
        <p className="panel-proyecto-copy">
          AguaVigía contrasta comunicados oficiales de Acuacar, reportes comunitarios y tiempos reales de restablecimiento. El mapa refleja el suministro en vivo; la bitácora conserva la evidencia.
        </p>
        <div className="panel-proyecto-metodo" aria-label="Fuentes del observatorio">
          <span><Droplets size={16} aria-hidden="true" /> Estado por sector</span>
          <span><Database size={16} aria-hidden="true" /> Evidencia trazable</span>
          <span><Activity size={16} aria-hidden="true" /> Monitoreo continuo</span>
        </div>
      </div>

      <div className="panel-proyecto-suscripcion">
        <BellRing size={22} aria-hidden="true" />
        <div>
          <strong>Tu barrio, sin tener que volver a buscar.</strong>
          <p>Recibe un aviso cuando cambie el servicio.</p>
        </div>
        <button
          type="button"
          onClick={onSuscribirse}
          className="panel-proyecto-boton"
          aria-label="Suscríbete para recibir avisos de tu barrio"
        >
          Activar avisos
        </button>
      </div>
    </div>
  </div>
)
