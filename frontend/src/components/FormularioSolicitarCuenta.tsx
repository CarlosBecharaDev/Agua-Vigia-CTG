import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, Mail, UserPlus } from 'lucide-react'
import { solicitarCuenta } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { CampoClave, LONGITUD_MINIMA_CLAVE } from './CampoClave'
import { EnlaceAlIngreso } from './EnlaceAlIngreso'

interface Props {
  /** Presente cuando el formulario vive dentro del modal: vuelve al ingreso sin cambiar de ruta. */
  onVolverAlIngreso?: () => void
}

/**
 * Registrarse no concede nada: hace falta confirmar el correo y que un administrador apruebe. El
 * formulario lo dice antes de pedir los datos, para que nadie espere entrar al terminar.
 *
 * El resultado es el mismo exista o no ya una cuenta con ese correo — el backend responde igual a
 * propósito, y contradecirlo aquí volvería a convertir el formulario en un buscador de cuentas.
 *
 * Vive suelto y no dentro de su página porque lo usan las dos entradas: el modal de la portada y la
 * ruta `/cuentas/registro`. Duplicarlo es cómo una de las dos se queda sin el arreglo siguiente.
 */
export function FormularioSolicitarCuenta({ onVolverAlIngreso }: Props) {
  const [correo, setCorreo] = useState('')
  const [nombre, setNombre] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await solicitarCuenta(correo, nombre, clave)
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
          Si la dirección es válida, te enviamos un enlace para confirmarla. Ábrelo y luego espera a
          que un administrador apruebe tu acceso: te avisaremos por correo.
        </p>
        <p className="cuenta-pista">
          ¿No llega? Revisa la carpeta de correo no deseado. El enlace vence en 48 horas.
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
        <label htmlFor="registro-nombre" className="form-reporte-label">
          <UserPlus size={15} color="#d8b4fe" />
          Tu nombre
        </label>
        <input
          id="registro-nombre"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="Como aparecerás en la auditoría"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="form-suscripcion-input"
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-reporte-bloque">
        <label htmlFor="registro-correo" className="form-reporte-label">
          <Mail size={15} color="#d8b4fe" />
          Correo
        </label>
        <input
          id="registro-correo"
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

      <CampoClave
        id="registro-clave"
        etiqueta="Elige tu clave"
        icono={KeyRound}
        valor={clave}
        onCambio={setClave}
      />

      {error && (
        <div className="form-suscripcion-error-badge" role="alert">
          {error}
        </div>
      )}

      <button
        className="form-suscripcion-boton-enviar"
        type="submit"
        disabled={enviando || !correo || !nombre || clave.length < LONGITUD_MINIMA_CLAVE}
        style={{ marginTop: '0.5rem' }}
      >
        {enviando ? (
          <>
            <span className="spinner" /> Enviando…
          </>
        ) : (
          'Solicitar acceso'
        )}
      </button>

      <p className="cuenta-pista" style={{ textAlign: 'center' }}>
        Solicitar una cuenta no da acceso al panel por sí solo.
      </p>

      <div className="cuenta-enlaces">
        <EnlaceAlIngreso onVolver={onVolverAlIngreso}>Ya tengo cuenta</EnlaceAlIngreso>
      </div>
    </form>
  )
}
