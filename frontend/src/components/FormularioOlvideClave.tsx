import { useState } from 'react'
import type { FormEvent } from 'react'
import { Mail } from 'lucide-react'
import { pedirRestablecimiento } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { EnlaceAlIngreso } from './EnlaceAlIngreso'

interface Props {
  /** Presente cuando el formulario vive dentro del modal: vuelve al ingreso sin cambiar de ruta. */
  onVolverAlIngreso?: () => void
}

/**
 * El mensaje de confirmación no dice si el correo estaba registrado, y es deliberado: un formulario
 * que responde "esa dirección no existe" es un buscador de cuentas. El backend responde igual en
 * los dos casos y esta pantalla no lo delata.
 */
export function FormularioOlvideClave({ onVolverAlIngreso }: Props) {
  const [correo, setCorreo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await pedirRestablecimiento(correo)
      setEnviado(true)
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <>
        <p className="cuenta-mensaje cuenta-mensaje-exito" role="status">
          Si esa dirección tiene una cuenta activa, el enlace ya va en camino. Ábrelo antes de 30
          minutos.
        </p>
        <p className="cuenta-pista">
          Al cambiar la clave se cierran todas las sesiones abiertas de esa cuenta.
        </p>
        <div className="cuenta-enlaces">
          <EnlaceAlIngreso onVolver={onVolverAlIngreso}>Volver al ingreso</EnlaceAlIngreso>
        </div>
      </>
    )
  }

  return (
    <form onSubmit={enviar} className="form-reporte-moderno">
      <div className="form-reporte-bloque">
        <label htmlFor="olvide-correo" className="form-reporte-label">
          <Mail size={15} color="#d8b4fe" />
          Correo de tu cuenta
        </label>
        <input
          id="olvide-correo"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.org"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="form-suscripcion-input"
          style={{ width: '100%' }}
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
        disabled={enviando || !correo}
        style={{ marginTop: '0.5rem' }}
      >
        {enviando ? (
          <>
            <span className="spinner" /> Enviando…
          </>
        ) : (
          'Enviarme el enlace'
        )}
      </button>

      <div className="cuenta-enlaces">
        <EnlaceAlIngreso onVolver={onVolverAlIngreso}>Volver al ingreso</EnlaceAlIngreso>
      </div>
    </form>
  )
}
