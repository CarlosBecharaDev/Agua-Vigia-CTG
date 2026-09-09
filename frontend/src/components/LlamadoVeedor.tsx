/**
 * Llamado a la acción que antecede al ingreso del veedor.
 *
 * Dos puertas y ninguna cuenta nueva: el panel es para veedores acreditados (JWT, RNF011) y el
 * vecino que solo quiere enterarse usa la suscripción que ya existe (M4, doble opt-in). No se pide
 * usuario ni contraseña al ciudadano a propósito — el reporte es anónimo por diseño (M2, "sin
 * registro"), y añadir cuentas contradiría esa decisión sin darle nada a cambio.
 */
import type { FC } from 'react'
import { ShieldCheck, BellRing, ArrowRight, Megaphone, Info } from 'lucide-react'
import './LlamadoVeedor.css'

interface Props {
  onSuscribirse: () => void
  onAbrirPanel: () => void
  onReportar: () => void
}

export const LlamadoVeedor: FC<Props> = ({ onSuscribirse, onAbrirPanel, onReportar }) => {

  return (
    <section id="veedor" className="llamado-veedor" aria-labelledby="llamado-veedor-titulo">
      <div className="llamado-veedor-tarjeta">
        <div className="llamado-veedor-agua" aria-hidden="true">
          <svg
            className="llamado-veedor-ola llamado-veedor-ola--fondo"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
          <svg
            className="llamado-veedor-ola llamado-veedor-ola--frente"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,30 C300,110 450,10 750,70 C950,110 1100,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>

        <div className="llamado-veedor-radar" aria-hidden="true">
          <span><i><b /></i></span>
        </div>

        <div className="llamado-veedor-contenido">
          <span className="llamado-veedor-eyebrow">
            <i aria-hidden="true" />
            Veeduría Ciudadana Costera • Distrito de Cartagena
          </span>

          <h2 id="llamado-veedor-titulo" className="llamado-veedor-titulo">
            Cartagena se vigila entre vecinos
          </h2>

          <p className="llamado-veedor-texto">
            Los <strong>veedores acreditados</strong> validan en tiempo real cada reporte de presión y
            corte que entra al sistema. Su labor técnica distingue las fallas comunitarias reales de
            las falsas alarmas, garantizando transparencia en los boletines distritales.
          </p>
          <p className="llamado-veedor-texto">
            Cualquier ciudadano puede sumarse a la red sin burocracia: suscribe tu barrio para
            recibir alertas preventivas o reporta una afectación sin crear una cuenta.
          </p>

          <div className="llamado-veedor-acciones">
            <button type="button" className="llamado-veedor-btn-primario" onClick={onAbrirPanel}>
              <ShieldCheck size={17} aria-hidden="true" />
              Ir al panel de veedor
              <ArrowRight size={15} aria-hidden="true" />
            </button>

            <button type="button" className="llamado-veedor-btn-secundario" onClick={onSuscribirse}>
              <BellRing size={17} aria-hidden="true" />
              Avisos de mi barrio
            </button>

            <button type="button" className="llamado-veedor-btn-terciario" onClick={onReportar}>
              <Megaphone size={17} aria-hidden="true" />
              Reportar afectación
            </button>
          </div>

          <p className="llamado-veedor-nota">
            <Info size={15} aria-hidden="true" />
            <span>
              La suscripción vecinal no exige claves ni trámites. Los veedores acreditados ingresan
              mediante token de verificación.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
