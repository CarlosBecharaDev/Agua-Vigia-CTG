import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import QRCode from 'qrcode'
import { ShieldCheck, Smartphone } from 'lucide-react'
import { confirmarSegundoFactor, iniciarAltaSegundoFactor } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import './ModalReporte.css'
import './Cuentas.css'

interface Props {
  /** Cierto para un ADMIN que aún no puede hacer nada más: no se le ofrece salir sin completarlo. */
  obligatorio?: boolean
  onListo?: () => void
  onCancelar?: () => void
}

/**
 * Alta del TOTP en dos pasos, igual que en el backend: primero el QR, y solo cuando la persona
 * devuelve un código correcto queda activo. Si se activara al mostrar el QR, un escaneo fallido
 * dejaría la cuenta sin forma de entrar.
 *
 * El secreto se pide una sola vez al montar y no se vuelve a pedir: cada llamada genera uno nuevo,
 * así que reintentar por un código mal tecleado invalidaría el QR que la persona acaba de escanear.
 */
export function AltaSegundoFactor({ obligatorio = false, onListo, onCancelar }: Props) {
  const [secreto, setSecreto] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const yaSePidio = useRef(false)

  useEffect(() => {
    // StrictMode monta dos veces en desarrollo; sin esta guarda, el segundo montaje pide un secreto
    // nuevo y deja inservible el QR que se acaba de pintar.
    if (yaSePidio.current) return
    yaSePidio.current = true

    iniciarAltaSegundoFactor()
      .then(async (alta) => {
        setSecreto(alta.secreto)
        setQr(await QRCode.toDataURL(alta.uri, { margin: 1, width: 220 }))
      })
      .catch((causa) => setError(normalizarErrorApi(causa).detalle))
      .finally(() => setCargando(false))
  }, [])

  const confirmar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setConfirmando(true)
    try {
      await confirmarSegundoFactor(codigo)
      onListo?.()
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
      setCodigo('')
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <main id="contenido-principal" tabIndex={-1} className="pagina-estado cuenta-pagina">
      <section className="modal-reporte-contenedor cuenta-tarjeta" aria-labelledby="titulo-2fa">
        <div className="modal-reporte-fondo-animado" aria-hidden="true">
          <div className="orbe-rep-1" />
          <div className="orbe-rep-2" />
        </div>

        <div className="modal-reporte-cabecera" style={{ marginBottom: '1rem' }}>
          <div className="modal-reporte-icono-titulo">
            <div
              className="modal-reporte-badge-icono"
              style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}
              aria-hidden="true"
            >
              <ShieldCheck size={26} />
            </div>
            <div className="modal-reporte-titulos">
              <h1 id="titulo-2fa" style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff' }}>
                Activa tu segundo factor
              </h1>
              <p>
                {obligatorio
                  ? 'Tu cuenta es de administrador: hasta activarlo, la sesión no abre nada más.'
                  : 'Un código que cambia cada 30 segundos, además de tu clave.'}
              </p>
            </div>
          </div>
        </div>

        {cargando && (
          <p className="cuenta-pista" style={{ textAlign: 'center' }}>
            <span className="spinner" /> Generando tu código…
          </p>
        )}

        {qr && (
          <>
            <div className="cuentas-qr">
              <img src={qr} alt="Código QR para configurar la aplicación de autenticación" width={220} height={220} />
            </div>
            <p className="cuenta-pista" style={{ textAlign: 'center' }}>
              Escanéalo con Google Authenticator, Aegis, 1Password o la app que uses. Si la cámara no
              coopera, escribe este código a mano:
            </p>
            <p className="cuentas-secreto">{secreto}</p>
          </>
        )}

        <form onSubmit={confirmar} className="form-reporte-moderno" style={{ marginTop: '1rem' }}>
          <div className="form-reporte-bloque">
            <label htmlFor="codigo-alta-2fa" className="form-reporte-label">
              <Smartphone size={15} color="#d8b4fe" />
              Escribe el código que muestra la app
            </label>
            <input
              id="codigo-alta-2fa"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={9}
              required
              placeholder="000000"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              className="form-suscripcion-input"
              style={{ width: '100%', letterSpacing: '0.35em', fontSize: '1.15rem' }}
            />
          </div>

          {error && (
            <div className="form-suscripcion-error-badge" role="alert">
              {error}
            </div>
          )}

          <button
            className="form-suscripcion-boton-enviar"
            type="submit"
            disabled={confirmando || !codigo || !qr}
          >
            {confirmando ? (
              <>
                <span className="spinner" /> Confirmando…
              </>
            ) : (
              'Activar segundo factor'
            )}
          </button>

          {onCancelar && (
            <button
              type="button"
              className="cuentas-btn"
              style={{ width: '100%', marginTop: '0.6rem' }}
              onClick={onCancelar}
            >
              {obligatorio ? 'Cerrar sesión y salir' : 'Ahora no'}
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
