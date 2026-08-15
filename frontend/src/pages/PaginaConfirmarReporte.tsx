/**
 * PaginaConfirmarReporte — RF038/M11: "¿Tú también?" con un solo clic.
 *
 * El backend no expone un listado público de reportes por sector (solo la cola de
 * moderación del veedor), así que el único id de reporte que un vecino puede confirmar es
 * uno que otro vecino le compartió a propósito: el enlace que ModalReporte/PaginaReportar
 * muestran justo después de enviar su propio reporte (ver "Compartir para que confirmen").
 *
 * Presentación: mismo pliego que /reportar. Quien llega aquí viene de WhatsApp y no sabe
 * qué es esto, así que la cabecera explica de dónde sale el enlace antes de pedirle nada,
 * y hay una sola acción en pantalla.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
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
      <main id="contenido-principal" tabIndex={-1} className="pagina-pliego reticula-carta">
        <article className="pliego" aria-labelledby="titulo-confirmar">
          <header className="pliego-cabecera">
            <p className="rotulo-carta pliego-rotulo">Confirmar un reporte</p>
            <h1 id="titulo-confirmar" className="pliego-titulo">¿A ti también te está pasando?</h1>
            <p className="pliego-entradilla">
              Un vecino reportó un problema con el agua y te pasó este enlace. Confirmarlo
              toma un toque y es lo que hace que el reporte llegue al mapa.
            </p>
          </header>

          <div className="pliego-cuerpo">
            {!id ? (
              <p className="pliego-error" role="alert">
                El enlace no incluye un reporte válido. Pídele a tu vecino que lo comparta otra vez.
              </p>
            ) : yaConfirmado ? (
              <div className="confirmacion" role="status">
                <span className="confirmacion-marca" aria-hidden="true"><Check size={17} strokeWidth={3} /></span>
                <div>
                  <h2>Confirmación enviada</h2>
                  <p className="confirmacion-texto">
                    Tu confirmación se sumó al consenso de este reporte. Cuantos más vecinos
                    confirmen, antes se publica el cambio en el mapa.
                  </p>
                  <div className="pliego-acciones">
                    <Link className="boton boton-primario" to="/">Ver el mapa</Link>
                    <Link className="boton boton-secundario" to="/reportar">Reportar mi barrio</Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="boton boton-primario boton-ancho"
                  disabled={mutacion.isPending}
                  onClick={() => mutacion.mutate()}
                >
                  {mutacion.isPending && <span className="spinner" aria-hidden="true" />}
                  {mutacion.isPending ? 'Confirmando…' : 'Sí, a mí también'}
                </button>
                {error && <p className="pliego-error" role="alert">{error.detalle}</p>}

                {/* RF006: el cupo por dispositivo se controla con una huella anónima. Se
                    dice aquí, junto a la acción, y no en un enlace legal. */}
                <p className="pliego-nota">
                  No pedimos ni guardamos datos tuyos. Usamos una huella anónima del
                  dispositivo solo para evitar confirmaciones repetidas.
                </p>
              </>
            )}
          </div>
        </article>
      </main>
    </PageWrapper>
  )
}
