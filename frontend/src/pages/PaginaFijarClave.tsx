import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KeyRound, MailPlus, RotateCcwKey } from 'lucide-react'
import { aceptarInvitacion, fijarClaveNueva } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { TarjetaCuenta } from '../components/TarjetaCuenta'
import { CampoClave, LONGITUD_MINIMA_CLAVE } from '../components/CampoClave'

interface Props {
  modo: 'invitacion' | 'restablecimiento'
}

/**
 * Los dos flujos que terminan con "elige una clave desde un enlace de correo". Comparten pantalla
 * porque comparten el riesgo y el manejo del token; lo único que cambia es qué deja la cuenta
 * después: activa por primera vez, o con clave nueva y todas las sesiones cerradas.
 */
export default function PaginaFijarClave({ modo }: Props) {
  const [parametros] = useSearchParams()
  const token = parametros.get('token')

  const [clave, setClave] = useState('')
  const [repetida, setRepetida] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esInvitacion = modo === 'invitacion'
  const coinciden = clave === repetida

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) {
      setError('El enlace no trae el token.')
      return
    }
    if (!coinciden) {
      setError('Las dos claves no coinciden.')
      return
    }

    setError(null)
    setEnviando(true)
    try {
      if (esInvitacion) {
        await aceptarInvitacion(token, clave)
      } else {
        await fijarClaveNueva(token, clave)
      }
      setListo(true)
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
    } finally {
      setEnviando(false)
      setClave('')
      setRepetida('')
    }
  }

  return (
    <PageWrapper>
      <TarjetaCuenta
        icono={esInvitacion ? MailPlus : RotateCcwKey}
        antetitulo="Panel del veedor"
        titulo={esInvitacion ? 'Acepta tu invitación' : 'Elige una clave nueva'}
        descripcion={
          esInvitacion
            ? 'Fija tu clave y podrás entrar de inmediato con el rol que te asignaron.'
            : 'Al cambiarla se cierran todas las sesiones abiertas de tu cuenta.'
        }
      >
        {listo ? (
          <>
            <p className="cuenta-mensaje cuenta-mensaje-exito" role="status">
              {esInvitacion
                ? 'Tu cuenta ya está activa. Puedes iniciar sesión con tu correo y esta clave.'
                : 'Clave cambiada y sesiones cerradas. Inicia sesión con la clave nueva.'}
            </p>
            <Link to="/veedor" className="enlace-cuenta">
              Ir al ingreso
            </Link>
          </>
        ) : !token ? (
          <>
            <div className="form-suscripcion-error-badge" role="alert">
              El enlace está incompleto: no trae el token.
            </div>
            <p className="cuenta-pista">
              Cópialo completo desde el correo, sin cortarlo al final.
            </p>
          </>
        ) : (
          <form onSubmit={enviar} className="form-reporte-moderno">
            <CampoClave
              id="fijar-clave"
              etiqueta="Tu clave nueva"
              icono={KeyRound}
              valor={clave}
              onCambio={setClave}
            />

            <div className="form-reporte-bloque">
              <label htmlFor="fijar-clave-repetida" className="form-reporte-label">
                <KeyRound size={15} color="#d8b4fe" />
                Escríbela otra vez
              </label>
              <input
                id="fijar-clave-repetida"
                type="password"
                required
                autoComplete="new-password"
                value={repetida}
                onChange={(event) => setRepetida(event.target.value)}
                className="form-suscripcion-input"
                style={{ width: '100%' }}
              />
              {repetida.length > 0 && !coinciden && (
                <p className="cuenta-pista">Las dos claves todavía no coinciden.</p>
              )}
            </div>

            {error && (
              <div className="form-suscripcion-error-badge" role="alert">
                {error}
              </div>
            )}

            <button
              className="form-suscripcion-boton-enviar"
              type="submit"
              disabled={enviando || clave.length < LONGITUD_MINIMA_CLAVE || !coinciden}
              style={{ marginTop: '0.5rem' }}
            >
              {enviando ? (
                <>
                  <span className="spinner" /> Guardando…
                </>
              ) : esInvitacion ? (
                'Activar mi cuenta'
              ) : (
                'Guardar la clave nueva'
              )}
            </button>

            <p className="cuenta-pista" style={{ textAlign: 'center' }}>
              Este enlace sirve una sola vez.
            </p>
          </form>
        )}
      </TarjetaCuenta>
    </PageWrapper>
  )
}
