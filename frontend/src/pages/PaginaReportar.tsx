/**
 * PaginaReportar — RF006: reportar sin registro y en dos pasos.
 *
 * Se rediseñó sobre un supuesto muy concreto: quien abre esta pantalla está en la calle,
 * sin agua y molesto, en un celular. De ahí las tres decisiones de presentación:
 *
 * 1. Se cayó el panel partido oscuro/claro. Además de ser un tercer lenguaje visual
 *    ajeno a la carta, tenía un fallo de contraste grave: pintaba el fondo con
 *    --color-marino y el título con blanco fijo, y --color-marino se invierte a papel
 *    (#EDE7D6) en carta de noche — el título quedaba en 1,24:1 sobre su propio fondo.
 * 2. Los dos pasos son ahora dos tramos siempre visibles, cada uno declarando su estado.
 *    Antes el paso 2 solo se atenuaba al 48 % de opacidad: ni decía por qué estaba
 *    bloqueado ni se leía bien.
 * 3. Un toque en una opción envía, como antes. Son dos pasos por requisito, no tres, así
 *    que en vez de añadir un botón de envío se escribe encima que al elegir se envía.
 */
import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Link as LinkIcon } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { normalizarErrorApi } from '../api/client'
import { registrarReporteCiudadano } from '../api/services'
import type { TipoReporte } from '../api/services'
import { EnlaceConfirmarReporte } from '../components/EnlaceConfirmarReporte'

/**
 * Cada opción lleva el token del estado que va a pintar en el mapa si el reporte prospera.
 * Es el mismo código de color de la leyenda: quien reporta ve qué está publicando sobre su
 * barrio antes de tocar.
 */
const OPCIONES: Array<{ tipo: TipoReporte; etiqueta: string; descripcion: string; color: string }> = [
  { tipo: 'SIN_AGUA', etiqueta: 'No me llega agua', descripcion: 'No sale agua de la llave.', color: 'var(--color-estado-sin)' },
  { tipo: 'PRESION_BAJA', etiqueta: 'Llega con poca presión', descripcion: 'Sale agua, pero con poca fuerza.', color: 'var(--color-estado-baja)' },
  { tipo: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el agua', descripcion: 'El servicio se restableció.', color: 'var(--color-estado-con)' },
]

export default function PaginaReportar() {
  const { sectores, cargando } = useDatosEnVivo()
  const [searchParams] = useSearchParams()
  const sectorPreseleccionado = searchParams.get('sector') ?? ''
  const [sectorId, setSectorId] = useState(sectorPreseleccionado)
  const queryClient = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (tipo: TipoReporte) => registrarReporteCiudadano(sectorId, tipo),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['sectores'] }) },
  })
  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  const ordenados = [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const barrioElegido = ordenados.find((sector) => sector.id === sectorId)
  const enviando = mutacion.isPending
  const tipoEnviando = mutacion.variables

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-pliego reticula-carta">
        <article className="pliego pliego--reporte" aria-labelledby="titulo-reportar">
          <header className="pliego-cabecera">
            <p className="rotulo-carta pliego-rotulo">Reporte ciudadano</p>
            <h1 id="titulo-reportar" className="pliego-titulo">Reporta el estado de tu barrio</h1>
            <p className="pliego-entradilla">
              Sin registro y en dos pasos. Tu reporte se suma al de tus vecinos y así se
              confirma lo que de verdad está pasando.
            </p>
          </header>

          <div className="pliego-cuerpo">
            {mutacion.isSuccess ? (
              <div className="confirmacion" role="status">
                <span className="confirmacion-marca" aria-hidden="true"><Check size={17} strokeWidth={3} /></span>
                <div>
                  <h2>Reporte enviado</h2>
                  <p className="confirmacion-texto">
                    Ya quedó registrado
                    {barrioElegido ? <> para <strong>{barrioElegido.nombre}</strong></> : null}. Se
                    publica en el mapa cuando otros vecinos lo confirmen o el veedor lo valide.
                  </p>

                  {/* RF038/M11: la confirmación de un vecino es lo que acelera la publicación,
                      así que el enlace para pedirla es la acción principal de este momento. */}
                  {mutacion.data?.id && (
                    <>
                      <p className="pliego-nota">
                        <LinkIcon size={13} aria-hidden="true" /> Pásale este enlace a un vecino:
                        cada confirmación acerca tu reporte al mapa.
                      </p>
                      <EnlaceConfirmarReporte reporteId={mutacion.data.id} />
                    </>
                  )}

                  <div className="pliego-acciones">
                    <button
                      className="boton boton-secundario"
                      type="button"
                      onClick={() => { mutacion.reset(); setSectorId('') }}
                    >
                      Reportar otro barrio
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Tramo 1 ─ el barrio. Se marca completo en cuanto hay uno elegido. */}
                <section className="tramo" data-estado={sectorId ? 'completo' : 'activo'}>
                  <span className="tramo-numero sonda" aria-hidden="true">
                    {sectorId ? <Check size={15} strokeWidth={3} /> : '1'}
                  </span>
                  <div>
                    <label className="tramo-titulo" htmlFor="sector-reporte">Selecciona tu barrio</label>
                    <span className="tramo-lectura">
                      {barrioElegido ? barrioElegido.nombre : 'Todavía sin elegir'}
                    </span>
                    <select
                      id="sector-reporte"
                      className="tramo-campo"
                      value={sectorId}
                      onChange={(event) => setSectorId(event.target.value)}
                      disabled={cargando}
                    >
                      <option value="">{cargando ? 'Cargando barrios…' : 'Elige un barrio'}</option>
                      {ordenados.map((sector) => (
                        <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Tramo 2 ─ la novedad. Un toque envía; por eso la lectura del tramo lo
                    avisa antes y no después. */}
                <section className="tramo" data-estado={!sectorId ? 'espera' : enviando ? 'completo' : 'activo'}>
                  <span className="tramo-numero sonda" aria-hidden="true">2</span>
                  <fieldset disabled={!sectorId || enviando}>
                    <legend className="tramo-titulo rotulo-hidrografico">¿Qué pasa con el agua ahora?</legend>
                    <span className="tramo-lectura">
                      {!sectorId
                        ? 'Elige primero tu barrio'
                        : enviando
                          ? 'Enviando tu reporte…'
                          : 'Al elegir una opción se envía el reporte'}
                    </span>
                    <div className="opciones-novedad">
                      {OPCIONES.map((opcion) => (
                        <button
                          type="button"
                          key={opcion.tipo}
                          className={`opcion-novedad${enviando && tipoEnviando === opcion.tipo ? ' is-enviando' : ''}`}
                          style={{ '--color-estado': opcion.color } as CSSProperties}
                          onClick={() => mutacion.mutate(opcion.tipo)}
                        >
                          <span className="opcion-novedad-marca" aria-hidden="true" />
                          <span>
                            <strong className="opcion-novedad-titulo">{opcion.etiqueta}</strong>
                            <span className="opcion-novedad-detalle">{opcion.descripcion}</span>
                          </span>
                          {enviando && tipoEnviando === opcion.tipo && (
                            <span className="spinner" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </section>

                {error && <p className="pliego-error" role="alert">{error.detalle}</p>}

                {/* RF006: el cupo por dispositivo se controla con una huella anónima. Decirlo
                    aquí y no en un enlace legal es parte del trato de reportar sin registro. */}
                <p className="pliego-nota">
                  No pedimos ni guardamos datos tuyos. Usamos una huella anónima del
                  dispositivo solo para limitar reportes repetidos.
                </p>
              </>
            )}
          </div>
        </article>
      </main>
    </PageWrapper>
  )
}
