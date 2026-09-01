import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { verificarCorreo } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { TarjetaCuenta } from '../components/TarjetaCuenta'

/**
 * El enlace del correo aterriza aquí y la verificación ocurre sola: pedir un clic más no añade
 * seguridad —quien abrió el enlace ya demostró tener el correo— y sí añade una pantalla en la que
 * la gente se queda parada.
 */
export default function PaginaVerificarCorreo() {
  const [parametros] = useSearchParams()
  const token = parametros.get('token')
  const [estado, setEstado] = useState<'verificando' | 'listo' | 'error'>('verificando')
  const [error, setError] = useState<string | null>(null)
  const yaSeIntento = useRef(false)

  useEffect(() => {
    // El token es de un solo uso: con StrictMode montando dos veces, el segundo intento lo
    // encontraría ya consumido y mostraría un error sobre una verificación que sí funcionó.
    if (yaSeIntento.current) return
    yaSeIntento.current = true

    if (!token) {
      setEstado('error')
      setError('El enlace no trae el token de confirmación.')
      return
    }

    verificarCorreo(token)
      .then(() => setEstado('listo'))
      .catch((causa) => {
        setEstado('error')
        setError(normalizarErrorApi(causa).detalle)
      })
  }, [token])

  return (
    <PageWrapper>
      <TarjetaCuenta
        icono={MailCheck}
        antetitulo="Panel del veedor"
        titulo="Confirmación de correo"
        descripcion="El penúltimo paso antes de que un administrador revise tu solicitud."
      >
        {estado === 'verificando' && (
          <p className="cuenta-pista" role="status">
            <span className="spinner" /> Confirmando tu correo…
          </p>
        )}

        {estado === 'listo' && (
          <>
            <p className="cuenta-mensaje cuenta-mensaje-exito" role="status">
              Correo confirmado. Tu solicitud está ahora en la cola de un administrador; te
              avisaremos por correo cuando decida.
            </p>
            <p className="cuenta-pista">
              Hasta entonces no podrás entrar al panel, aunque tu clave sea correcta.
            </p>
          </>
        )}

        {estado === 'error' && (
          <>
            <div className="form-suscripcion-error-badge" role="alert">
              {error}
            </div>
            <p className="cuenta-pista">
              Los enlaces vencen a las 48 horas y sirven una sola vez. Si el tuyo caducó, vuelve a
              solicitar la cuenta.
            </p>
            <Link to="/cuentas/registro" className="enlace-cuenta">
              Solicitar de nuevo
            </Link>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link to="/veedor" className="enlace-cuenta">
            Ir al ingreso
          </Link>
        </div>
      </TarjetaCuenta>
    </PageWrapper>
  )
}
