import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Megaphone, DropletOff, Gauge, CheckCircle } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { normalizarErrorApi } from '../api/client'
import { registrarReporteCiudadano } from '../api/services'
import type { TipoReporte } from '../api/services'
import { EnlaceConfirmarReporte } from '../components/EnlaceConfirmarReporte'
import '../components/ModalReporte.css'

const OPCIONES: Array<{ tipo: TipoReporte; etiqueta: string; descripcion: string; Icono: typeof DropletOff; clase: string }> = [
  { tipo: 'SIN_AGUA', etiqueta: 'No tengo agua', descripcion: 'El servicio está completamente interrumpido.', Icono: DropletOff, clase: 'opcion-sin-agua' },
  { tipo: 'PRESION_BAJA', etiqueta: 'Presión muy baja', descripcion: 'El agua llega con un hilo o poca fuerza.', Icono: Gauge, clase: 'opcion-presion-baja' },
  { tipo: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el servicio', descripcion: 'Confirma que el agua regresó con normalidad.', Icono: CheckCircle, clase: 'opcion-restablecido' },
]

export default function PaginaReportar() {
  const { estado, sectores, cargando, error: errorSectores, recargar } = useDatosEnVivo()
  const [searchParams] = useSearchParams()
  const sectorPreseleccionado = searchParams.get('sector') ?? ''
  const [sectorId, setSectorId] = useState(sectorPreseleccionado)
  const queryClient = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (tipo: TipoReporte) => registrarReporteCiudadano(sectorId, tipo),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['sectores'] }) },
  })
  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado pagina-reportar">
        <section
          className="modal-reporte-contenedor pagina-reportar-tarjeta"
          aria-labelledby="titulo-reportar"
        >
          <div className="modal-reporte-cabecera">
            <div className="modal-reporte-icono-titulo">
              <div className="modal-reporte-badge-icono" aria-hidden="true">
                <Megaphone size={24} />
              </div>
              <div className="modal-reporte-titulos">
                <h1 id="titulo-reportar">Reporta el estado de tu barrio</h1>
                <p>Participación ciudadana anónima en dos pasos.</p>
              </div>
            </div>
          </div>

          {mutacion.isSuccess ? (
            <div className="suscripcion-exito-moderno" role="status">
              <div className="suscripcion-exito-icono">
                <CheckCircle2 size={36} />
              </div>
              <div className="suscripcion-exito-titulos">
                <h3>Reporte recibido</h3>
                <p>Gracias por ayudar a mantener informada a toda Cartagena.</p>
              </div>
              {mutacion.data?.id && <EnlaceConfirmarReporte reporteId={mutacion.data.id} />}
              <button
                className="form-suscripcion-boton-enviar boton-reporte-secundario"
                type="button"
                onClick={() => { mutacion.reset(); setSectorId('') }}
              >
                Enviar otro reporte
              </button>
            </div>
          ) : (
            <div className="form-reporte-moderno">
              <div className="form-reporte-bloque">
                <label htmlFor="sector-reporte" className="form-reporte-label">
                  <span className="form-suscripcion-chip-paso">1</span>
                  Selecciona tu barrio
                </label>
                <select
                  id="sector-reporte"
                  value={sectorId}
                  onChange={(event) => setSectorId(event.target.value)}
                  disabled={cargando || estado === 'error'}
                  className="form-reporte-select"
                >
                  <option value="">{cargando ? 'Cargando barrios…' : 'Elige un barrio de Cartagena…'}</option>
                  {[...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((sector) => (
                    <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                  ))}
                </select>
                {estado === 'error' && (
                  <div className="form-suscripcion-error-badge" role="alert">
                    <span>{errorSectores || 'No pudimos cargar los barrios.'}</span>
                    <button type="button" onClick={recargar}>Reintentar</button>
                  </div>
                )}
              </div>

              <fieldset disabled={!sectorId || mutacion.isPending} className="form-reporte-bloque">
                <legend className="form-reporte-label form-reporte-leyenda">
                  <span className="form-suscripcion-chip-paso">2</span>
                  ¿Qué está pasando ahora?
                </legend>
                <div className="form-reporte-opciones-grid">
                  {OPCIONES.map(({ tipo, etiqueta, descripcion, Icono, clase }) => (
                    <button
                      type="button"
                      key={tipo}
                      onClick={() => mutacion.mutate(tipo)}
                      className={`form-reporte-opcion-btn ${clase}`}
                    >
                      <div className="form-reporte-opcion-icono">
                        <Icono size={20} aria-hidden="true" />
                      </div>
                      <div className="form-reporte-opcion-textos">
                        <strong>{etiqueta}</strong>
                        <small>{descripcion}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </fieldset>

              {mutacion.isPending && (
                <p className="form-reporte-progreso" role="status">
                  <span className="spinner" /> Enviando reporte a la red…
                </p>
              )}

              {error && (
                <div className="form-suscripcion-error-badge" role="alert">
                  {error.detalle}
                </div>
              )}

              <p className="form-reporte-privacidad">
                Usamos una huella anónima del dispositivo para limitar reportes repetidos sin pedir datos personales.
              </p>
            </div>
          )}
        </section>
      </main>
    </PageWrapper>
  )
}
