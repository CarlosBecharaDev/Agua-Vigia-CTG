import type { FC } from 'react'
import { ArrowRight, BellRing, ShieldCheck } from 'lucide-react'
import './LlamadoVeedor.css'

interface Props {
  onSuscribirse: () => void
  onAbrirPanel: () => void
}

export const LlamadoVeedor: FC<Props> = ({ onSuscribirse, onAbrirPanel }) => (
  <section id="veedor" className="llamado-veedor" aria-labelledby="llamado-veedor-titulo">
    <div className="llamado-veedor-envoltorio">
      <div className="llamado-veedor-tarjeta">
        <span className="llamado-veedor-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" /> Participación ciudadana
        </span>
        <h2 id="llamado-veedor-titulo" className="llamado-veedor-titulo">
          Ayuda a verificar el servicio en tu barrio
        </h2>
        <p className="llamado-veedor-texto">
          Recibe avisos de fuentes públicas o entra al espacio de veeduría. Las cifras y reportes solo aparecen cuando existen en el sistema.
        </p>
        <div className="llamado-veedor-acciones">
          <button type="button" className="llamado-veedor-btn-primario" onClick={onSuscribirse}>
            <BellRing size={17} aria-hidden="true" /> Recibir alertas
          </button>
          <button type="button" className="llamado-veedor-btn-secundario" onClick={onAbrirPanel}>
            Entrar como veedor <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </section>
)
