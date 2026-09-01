import { useEffect } from 'react'
import { LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { cerrarSesionVeedor } from '../api/services'
import { useSesionVeedor } from '../hooks/useSesionVeedor'
import { PanelVeedor } from './PanelVeedor'
import { AltaSegundoFactor } from './AltaSegundoFactor'
import { FormularioIngreso } from './FormularioIngreso'
import './ModalReporte.css'
import './SeccionVeedor.css'
import './Cuentas.css'

interface Props {
  /** El ingreso es emergente: lo abre "Ir al panel" desde el llamado a la veeduría. */
  loginAbierto: boolean
  onCerrarLogin: () => void
}

export function SeccionVeedor({ loginAbierto, onCerrarLogin }: Props) {
  const { autenticado, debeCompletarSegundoFactor } = useSesionVeedor()

  useEffect(() => {
    if (!loginAbierto) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrarLogin()
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [loginAbierto, onCerrarLogin])

  const cerrar = () => {
    void cerrarSesionVeedor()
  }

  // El panel autenticado necesita toda la página; el ingreso, en cambio, es un trámite corto y
  // por eso pasa a ser emergente. Se separan porque son dos cosas distintas, no dos estados de una.
  if (autenticado) {
    return (
      <section id="panel-veedor" className="seccion-veedor-root">
        {debeCompletarSegundoFactor ? (
          <AltaSegundoFactor obligatorio onCancelar={cerrar} />
        ) : (
          <PanelVeedor onCerrarSesion={cerrar} />
        )}
      </section>
    )
  }

  if (!loginAbierto) return null

  return (
    <div
      className="veedor-modal-fondo"
      role="presentation"
      // Solo cierra si el clic nace y muere en el fondo: arrastrar desde dentro del formulario
      // hasta fuera no debe cerrar lo que se estaba escribiendo.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrarLogin()
      }}
    >
      <div className="veedor-modal-caja" role="dialog" aria-modal="true" aria-labelledby="titulo-veedor">
        <button
          type="button"
          className="veedor-modal-cerrar"
          onClick={onCerrarLogin}
          aria-label="Cerrar el ingreso del veedor"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="seccion-veedor-contenido">
          <div
            className="modal-reporte-contenedor"
            style={{
              width: 'min(100%, 480px)',
              maxHeight: 'none',
              position: 'relative',
              background: 'transparent',
              border: 0,
              boxShadow: 'none',
            }}
            aria-labelledby="titulo-veedor"
          >
            {/* Fondo animado morado */}
            <div className="modal-reporte-fondo-animado" aria-hidden="true">
              <div className="orbe-rep-1" />
              <div className="orbe-rep-2" />
            </div>

            <div className="modal-reporte-cabecera" style={{ marginBottom: '1.25rem' }}>
              <div className="modal-reporte-icono-titulo">
                <div
                  className="modal-reporte-badge-icono"
                  style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}
                  aria-hidden="true"
                >
                  <ShieldCheck size={26} />
                </div>
                <div className="modal-reporte-titulos">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#c084fc',
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: '0.2rem',
                    }}
                  >
                    <LockKeyhole size={12} /> Acceso Restringido
                  </div>
                  <h2 id="titulo-veedor" style={{ fontSize: '1.45rem', margin: 0, color: '#ffffff' }}>
                    Ingreso del Veedor
                  </h2>
                  <p>Centro de moderación oficial y control operativo.</p>
                </div>
              </div>
            </div>

            <FormularioIngreso onIngreso={onCerrarLogin} />
          </div>
        </div>
      </div>
    </div>
  )
}
