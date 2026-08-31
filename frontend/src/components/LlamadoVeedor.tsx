/**
 * Llamado a la acción que antecede al ingreso del veedor.
 *
 * Dos puertas y ninguna cuenta nueva: el panel es para veedores acreditados (JWT, RNF011) y el
 * vecino que solo quiere enterarse usa la suscripción que ya existe (M4, doble opt-in). No se pide
 * usuario ni contraseña al ciudadano a propósito — el reporte es anónimo por diseño (M2, "sin
 * registro"), y añadir cuentas contradiría esa decisión sin darle nada a cambio.
 */
import type { FC } from 'react'
import { ShieldCheck, BellRing, ArrowRight } from 'lucide-react'
import './LlamadoVeedor.css'

interface Props {
  onSuscribirse: () => void
  onAbrirPanel: () => void
}

export const LlamadoVeedor: FC<Props> = ({ onSuscribirse, onAbrirPanel }) => {

  return (
    <section id="veedor" className="llamado-veedor" aria-labelledby="llamado-veedor-titulo">
      <div className="llamado-veedor-tarjeta">
        <span className="llamado-veedor-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" />
          Veeduría ciudadana
        </span>

        <h2 id="llamado-veedor-titulo" className="llamado-veedor-titulo">
          Cartagena se vigila entre vecinos
        </h2>

        <p className="llamado-veedor-texto">
          Los <strong>veedores</strong> revisan los reportes de la comunidad y confirman qué barrios
          se quedaron sin agua. Su trabajo es lo que separa un dato verificado de un rumor, y por eso
          el panel solo lo abren las personas acreditadas para esa tarea.
        </p>
        <p className="llamado-veedor-texto">
          No hace falta ser veedor para participar: cualquier vecino puede recibir en su correo los
          avisos de su propio barrio, y reportar una falta de agua sin registrarse.
        </p>

        <div className="llamado-veedor-acciones">
          <button type="button" className="llamado-veedor-btn-primario" onClick={onAbrirPanel}>
            <ShieldCheck size={17} aria-hidden="true" />
            Ir al panel
            <ArrowRight size={15} aria-hidden="true" />
          </button>

          <button type="button" className="llamado-veedor-btn-secundario" onClick={onSuscribirse}>
            <BellRing size={17} aria-hidden="true" />
            Suscribirme a mi barrio
          </button>
        </div>

        <p className="llamado-veedor-nota">
          El panel pide la clave del veedor. La suscripción solo pide tu barrio y tu correo, y te
          manda un enlace para confirmar que eres tú.
        </p>
      </div>
    </section>
  )
}
