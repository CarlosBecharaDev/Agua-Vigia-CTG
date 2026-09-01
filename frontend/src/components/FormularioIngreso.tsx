import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, tipoDeProblema, TIPO_SEGUNDO_FACTOR_REQUERIDO } from '../api/client'
import type { SesionVeedor } from '../api/client'

interface Props {
  onIngreso: (sesion: SesionVeedor) => void
  /** Mensaje heredado de la pantalla anterior, p. ej. "la sesión venció". */
  avisoInicial?: string | null
}

/**
 * El ingreso al panel, compartido por la página `/veedor` y por el modal de la portada. Estaba
 * duplicado en las dos y con el segundo factor pasan a ser dos pasos: mantener dos copias de una
 * máquina de estados es cómo una de ellas se queda sin el paso nuevo.
 *
 * El código no se pide de entrada. Se pide solo cuando el backend responde que hace falta, para que
 * quien no tiene segundo factor no vea un campo que no le toca.
 */
export function FormularioIngreso({ onIngreso, avisoInicial }: Props) {
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pidiendoCodigo, setPidiendoCodigo] = useState(false)
  const [mostrarClave, setMostrarClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(avisoInicial ?? null)

  const campoCodigo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pidiendoCodigo) campoCodigo.current?.focus()
  }, [pidiendoCodigo])

  const ingresar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const sesion = await iniciarSesionVeedor(correo, clave, pidiendoCodigo ? codigo : undefined)
      setClave('')
      setCodigo('')
      onIngreso(sesion)
    } catch (causa) {
      if (tipoDeProblema(causa) === TIPO_SEGUNDO_FACTOR_REQUERIDO) {
        // No es un fallo: la clave era correcta y falta el segundo paso. Decir "clave incorrecta"
        // aquí sería lo contrario de la verdad.
        setPidiendoCodigo(true)
        setError(null)
      } else {
        setPidiendoCodigo(false)
        setCodigo('')
        setError(normalizarErrorApi(causa).detalle)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={ingresar} className="form-reporte-moderno">
      <div className="form-reporte-bloque">
        <label htmlFor="correo-veedor" className="form-reporte-label">
          <Mail size={15} color="#d8b4fe" />
          Correo
        </label>
        <input
          id="correo-veedor"
          type="email"
          required
          autoComplete="username"
          placeholder="tu@correo.org"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="form-suscripcion-input"
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-reporte-bloque">
        <label htmlFor="clave-veedor" className="form-reporte-label">
          <KeyRound size={15} color="#d8b4fe" />
          Clave
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="clave-veedor"
            type={mostrarClave ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Tu clave de acceso…"
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
              minWidth: 44,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            {mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {pidiendoCodigo && (
        <div className="form-reporte-bloque">
          <label htmlFor="codigo-totp" className="form-reporte-label">
            <Smartphone size={15} color="#d8b4fe" />
            Código de tu app de autenticación
          </label>
          <input
            id="codigo-totp"
            ref={campoCodigo}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={9}
            required
            placeholder="000000"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            className="form-suscripcion-input"
            style={{ width: '100%', letterSpacing: '0.35em', fontSize: '1.15rem' }}
          />
          <p style={{ color: 'rgba(203, 213, 225, 0.55)', fontSize: '0.72rem', margin: '0.4rem 0 0' }}>
            Tu clave es correcta. Falta el código de 6 dígitos que cambia cada 30 segundos.
          </p>
        </div>
      )}

      {error && (
        <div className="form-suscripcion-error-badge" role="alert">
          {error}
        </div>
      )}

      <button
        className="form-suscripcion-boton-enviar"
        type="submit"
        disabled={enviando || !correo || !clave || (pidiendoCodigo && !codigo)}
        style={{ marginTop: '0.5rem' }}
      >
        {enviando ? (
          <>
            <span className="spinner" /> Verificando…
          </>
        ) : (
          <>
            <ShieldCheck size={16} /> {pidiendoCodigo ? 'Confirmar código' : 'Iniciar sesión'}
          </>
        )}
      </button>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem 1rem',
          justifyContent: 'center',
          marginTop: '0.85rem',
        }}
      >
        <Link to="/cuentas/registro" className="enlace-cuenta">
          Solicitar una cuenta
        </Link>
        <Link to="/cuentas/olvide-mi-clave" className="enlace-cuenta">
          Olvidé mi clave
        </Link>
      </div>

      <p
        style={{
          color: 'rgba(203, 213, 225, 0.55)',
          fontSize: '0.72rem',
          textAlign: 'center',
          margin: '0.75rem 0 0',
        }}
      >
        La sesión dura un máximo de 8 horas y se cierra en el servidor, no solo en este navegador.
      </p>
    </form>
  )
}
