/**
 * PaginaConfirmarReporte — RF038/M11: "¿Tú también?" con un solo clic.
 *
 * El backend no expone un listado público de reportes por sector (solo la cola de
 * moderación del veedor), así que el único id de reporte que un vecino puede confirmar es
 * uno que otro vecino le compartió a propósito: el enlace que ModalReporte/PaginaReportar
 * muestran justo después de enviar su propio reporte (ver "Compartir para que confirmen").
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { normalizarErrorApi } from '../api/client'
import { confirmarReporte } from '../api/services'

export default function PaginaConfirmarReporte() {
  const { id } = useParams<{ id: string }>()
  const [yaConfirmado, setYaConfirmado] = useState(false)
  const mutacion = useMutation({
    mutationFn: () => confirmarReporte(id!),
    onSuccess: () => setYaConfirmado(true),
  })
  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado pagina-reporte-real">
        <section className="reporte-real" aria-labelledby="titulo-confirmar">
          <div className="reporte-real-intro">
            <span className="estado-pagina-icono icono-coral" aria-hidden="true"><ShieldCheck /></span>
            <p className="eyebrow">Consenso ciudadano</p>
            <h1 id="titulo-confirmar">¿A ti también te está pasando?</h1>
            <p>Un vecino reportó un problema con el agua y te invitó a confirmarlo. Un clic, sin formularios.</p>
          </div>

          {!id ? (
            <p className="mensaje-error" role="alert">El enlace no incluye un reporte válido.</p>
          ) : yaConfirmado ? (
            <div className="reporte-real-exito" role="status">
              <CheckCircle2 />
              <h2>¡Gracias por confirmar!</h2>
              <p>Tu confirmación ya quedó sumada al consenso de este reporte.</p>
              <Link className="boton boton-secundario" to="/">Ver el mapa</Link>
            </div>
          ) : (
            <div className="reporte-real-formulario">
              <button
                type="button"
                className="boton boton-primario"
                disabled={mutacion.isPending}
                onClick={() => mutacion.mutate()}
              >
                {mutacion.isPending ? 'Confirmando…' : 'Sí, a mí también'}
              </button>
              {error && <p className="mensaje-error" role="alert">{error.detalle}</p>}
              <small>Usamos una huella anónima del dispositivo únicamente para evitar confirmaciones repetidas.</small>
            </div>
          )}
        </section>
      </main>
    </PageWrapper>
  )
}
