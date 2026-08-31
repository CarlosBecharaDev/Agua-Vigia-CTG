import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { cerrarSesionVeedor, iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, sesionVeedor } from '../api/client'
import { PanelVeedor } from './PanelVeedor'
import './ModalReporte.css'
import './SeccionVeedor.css'

interface Props {
  /** El ingreso es emergente: lo abre "Ir al panel" desde el llamado a la veeduría. */
  loginAbierto: boolean
  onCerrarLogin: () => void
}

export function SeccionVeedor({ loginAbierto, onCerrarLogin }: Props) {
  const [autenticado, setAutenticado] = useState(Boolean(sesionVeedor.obtener()))
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => sesionVeedor.alLimpiarse(() => {
    setAutenticado(false)
    setError('La sesión venció. Inicia sesión de nuevo.')
  }), [])

  useEffect(() => {
    if (!loginAbierto) return
    const alPulsar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrarLogin() }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [loginAbierto, onCerrarLogin])

  const iniciar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesionVeedor(clave)
      setClave('')
      setAutenticado(true)
      onCerrarLogin()
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
    } finally {
      setEnviando(false)
    }
  }

  const cerrar = () => {
    cerrarSesionVeedor()
    setAutenticado(false)
  }

  // El panel autenticado necesita toda la página; el ingreso, en cambio, es un trámite corto y
  // por eso pasa a ser emergente. Se separan porque son dos cosas distintas, no dos estados de una.
  if (autenticado) {
    return (
      <section id="panel-veedor" className="seccion-veedor-root">
        <PanelVeedor onCerrarSesion={cerrar} />
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
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrarLogin() }}
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
            style={{ width: 'min(100%, 480px)', maxHeight: 'none', position: 'relative', background: 'transparent', border: 0, boxShadow: 'none' }}
            aria-labelledby="titulo-veedor"
          >
            {/* Fondo animado morado */}
            <div className="modal-reporte-fondo-animado" aria-hidden="true">
              <div className="orbe-rep-1" />
              <div className="orbe-rep-2" />
            </div>

            <div className="modal-reporte-cabecera" style={{ marginBottom: '1.25rem' }}>
              <div className="modal-reporte-icono-titulo">
                <div className="modal-reporte-badge-icono" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }} aria-hidden="true">
                  <ShieldCheck size={26} />
                </div>
                <div className="modal-reporte-titulos">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.72rem', fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    <LockKeyhole size={12} /> Acceso Restringido
                  </div>
                  <h2 id="titulo-veedor" style={{ fontSize: '1.45rem', margin: 0, color: '#ffffff' }}>Ingreso del Veedor</h2>
                  <p>Centro de moderación oficial y control operativo.</p>
                </div>
              </div>
            </div>

            <form onSubmit={iniciar} className="form-reporte-moderno">
              <div className="form-reporte-bloque">
                <label htmlFor="clave-veedor" className="form-reporte-label">
                  <KeyRound size={15} color="#d8b4fe" />
                  Clave del veedor
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="clave-veedor"
                    type={mostrarClave ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Introduce la clave de acceso…"
                    value={clave}
                    onChange={(event) => setClave(event.target.value)}
                    className="form-suscripcion-input"
                    style={{ paddingRight: '2.75rem', width: '100%' }}
                  />
                  <button
                    type="button"
                    aria-label={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'}
                    onClick={() => setMostrarClave((actual) => !actual)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(203, 213, 225, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.25rem',
                    }}
                  >
                    {mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="form-suscripcion-error-badge" role="alert">
                  {error}
                </div>
              )}

              <button
                className="form-suscripcion-boton-enviar"
                type="submit"
                disabled={enviando || !clave}
                style={{ marginTop: '0.5rem' }}
              >
                {enviando ? <><span className="spinner" /> Verificando…</> : 'Iniciar sesión'}
              </button>

              <p style={{ color: 'rgba(203, 213, 225, 0.55)', fontSize: '0.72rem', textAlign: 'center', margin: '0.5rem 0 0' }}>
                La sesión permanece activa por un máximo de 8 horas con cifrado de grado industrial.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
