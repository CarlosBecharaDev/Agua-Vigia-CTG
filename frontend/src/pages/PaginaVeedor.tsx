import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { cerrarSesionVeedor, iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, sesionVeedor } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { PanelVeedor } from '../components/PanelVeedor'
import '../components/ModalReporte.css'

export default function PaginaVeedor() {
  const [autenticado, setAutenticado] = useState(Boolean(sesionVeedor.obtener()))
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => sesionVeedor.alLimpiarse(() => {
    setAutenticado(false)
    setError('La sesión venció. Inicia sesión de nuevo.')
  }), [])

  const iniciar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesionVeedor(clave)
      setClave('')
      setAutenticado(true)
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

  if (autenticado) {
    return <PageWrapper><PanelVeedor onCerrarSesion={cerrar} /></PageWrapper>
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh', padding: '3rem 1rem 6rem' }}>
        <section
          className="modal-reporte-contenedor"
          style={{ width: 'min(100%, 480px)', maxHeight: 'none' }}
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
                <h1 id="titulo-veedor" style={{ fontSize: '1.45rem', margin: 0, color: '#ffffff' }}>Ingreso del Veedor</h1>
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
        </section>
      </main>
    </PageWrapper>
  )
}
