/**
 * PanelVeedor — la mesa donde se corrige la carta.
 *
 * Una carta náutica no se publica y se olvida: se corrige. Llegan avisos, alguien los
 * contrasta contra la fuente y solo entonces entran al papel. Este panel es exactamente
 * ese puesto de trabajo, y por eso está ordenado como una mesa de correcciones y no como
 * una landing: primero las dos colas de correcciones pendientes (las que manda el vecino
 * y las que propone la ingesta), después el registro de cortes oficiales y el asiento de
 * uno nuevo.
 *
 * El orden manda un mensaje que es requisito, no estética: la ingesta propone y el veedor
 * publica (ADR-028), así que su cola vive al lado de la cola ciudadana, con la cita
 * textual del documento original bien visible — es contra ella que se aprueba o descarta.
 *
 * La magenta del sistema (aviso náutico) aparece en dos sitios y en ninguno más: la
 * promesa de restablecimiento ya vencida y el índice de cumplimiento incumplido. Es la
 * brecha entre lo prometido y lo real, que es el diferencial del producto (M6).
 */
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronUp, LogOut, RefreshCw, X } from 'lucide-react'
import {
  aprobarPropuestaIngesta,
  cerrarCorteOficial,
  crearCorteOficial,
  descartarPropuestaIngesta,
  listarCortesPorSector,
  listarPropuestasIngesta,
  listarReportesPendientes,
  moderarReporte,
  obtenerCorte,
  obtenerIndiceCumplimientoPorCorte,
  obtenerSaludIngesta,
  obtenerSectores,
} from '../api/services'
import type { CorteOficial } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import './PanelVeedor.css'

interface Props { onCerrarSesion: () => void }

function fechaLocalAISO(valor: string): string {
  return new Date(valor).toISOString()
}

function fechaLegible(valor: string | null | undefined, ausente = '—'): string {
  return valor ? new Date(valor).toLocaleString('es-CO') : ausente
}

/**
 * Un corte cuya hora prometida ya pasó y que sigue sin restablecerse. Es la brecha del
 * producto (M6) en el momento en que ocurre, no cuando ya se puede calcular el índice:
 * marcarla aquí es lo que convierte la lista en una cola de trabajo y no en un archivo.
 * Se deduce de datos que la fila ya muestra — no consulta nada nuevo al servidor.
 */
function promesaVencida(corte: CorteOficial): boolean {
  if (corte.estado === 'RESTABLECIDO' || !corte.finPrometido) return false
  return new Date(corte.finPrometido).getTime() < Date.now()
}

export function PanelVeedor({ onCerrarSesion }: Props) {
  const queryClient = useQueryClient()
  const [sectorFiltro, setSectorFiltro] = useState('')
  const [sectoresNuevos, setSectoresNuevos] = useState<string[]>([])
  const [inicio, setInicio] = useState('')
  const [finPrometido, setFinPrometido] = useState('')
  const [causa, setCausa] = useState('')
  const [corteExpandidoId, setCorteExpandidoId] = useState<string | null>(null)

  const reportes = useQuery({ queryKey: ['veedor', 'reportes', 'pendientes'], queryFn: listarReportesPendientes })
  const propuestas = useQuery({ queryKey: ['veedor', 'ingesta', 'propuestas'], queryFn: listarPropuestasIngesta })
  const saludIngesta = useQuery({ queryKey: ['veedor', 'ingesta', 'salud'], queryFn: obtenerSaludIngesta })
  const sectores = useQuery({ queryKey: ['sectores'], queryFn: obtenerSectores })
  const cortes = useQuery({
    queryKey: ['veedor', 'cortes', sectorFiltro],
    queryFn: () => listarCortesPorSector(sectorFiltro),
    enabled: Boolean(sectorFiltro),
  })
  const corteExpandidoEnLista = cortes.data?.find((corte) => corte.id === corteExpandidoId)
  const detalleCorte = useQuery({
    queryKey: ['veedor', 'cortes', 'detalle', corteExpandidoId],
    queryFn: () => obtenerCorte(corteExpandidoId!),
    enabled: Boolean(corteExpandidoId),
  })
  const indiceCorte = useQuery({
    queryKey: ['cumplimiento', 'corte', corteExpandidoId],
    queryFn: () => obtenerIndiceCumplimientoPorCorte(corteExpandidoId!),
    enabled: Boolean(corteExpandidoId) && corteExpandidoEnLista?.estado === 'RESTABLECIDO',
  })

  const moderar = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'aprobar' | 'descartar' }) => moderarReporte(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veedor', 'reportes', 'pendientes'] }),
  })
  const revisarPropuesta = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'aprobar' | 'descartar' }) =>
      decision === 'aprobar' ? aprobarPropuestaIngesta(id) : descartarPropuestaIngesta(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veedor', 'ingesta', 'propuestas'] }),
  })
  const registrarCorte = useMutation({
    mutationFn: crearCorteOficial,
    onSuccess: async () => {
      const primerSector = sectoresNuevos[0]
      setCausa(''); setInicio(''); setFinPrometido('')
      setSectoresNuevos([])
      if (primerSector) setSectorFiltro(primerSector)
      await queryClient.invalidateQueries({ queryKey: ['veedor', 'cortes'] })
    },
  })
  const cerrarCorte = useMutation({
    mutationFn: (id: string) => cerrarCorteOficial(id, new Date().toISOString()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['veedor', 'cortes'] }),
  })

  const barrios = useMemo(
    () => [...(sectores.data?.sectores ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [sectores.data],
  )
  const error = reportes.error || sectores.error || cortes.error || moderar.error || registrarCorte.error || cerrarCorte.error
    || propuestas.error || revisarPropuesta.error

  // Un colector se da por caído a los tres fallos seguidos, igual que lo pintaba la
  // versión anterior de este panel: el umbral es del backend, aquí solo se lee.
  const colectores = saludIngesta.data ?? []
  const colectoresCaidos = colectores.filter((colector) => colector.fallosConsecutivos >= 3).length

  const crearCorte = (event: FormEvent) => {
    event.preventDefault()
    if (sectoresNuevos.length === 0 || !inicio || !finPrometido || !causa.trim()) return
    registrarCorte.mutate({ sectoresAfectados: sectoresNuevos, inicio: fechaLocalAISO(inicio), finPrometido: fechaLocalAISO(finPrometido), causa: causa.trim() })
  }

  const avisoDelError = error ? normalizarErrorApi(error) : null

  return (
    <main id="contenido-principal" tabIndex={-1} className="panel-veedor reticula-carta" aria-labelledby="titulo-panel-veedor">
      <header className="mesa-cabecera">
        <div className="mesa-identidad">
          <p className="rotulo-carta mesa-rotulo">Puesto de corrección de la carta</p>
          <h1 id="titulo-panel-veedor">Centro operativo del veedor</h1>
          {/* Itálica hidrográfica: es la única línea del panel que habla del agua misma. */}
          <p className="rotulo-hidrografico mesa-lema">Nada entra a la carta sin que alguien pueda sustentarlo</p>
        </div>
        <button type="button" className="boton-carta mesa-salir" onClick={onCerrarSesion}>
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </button>
      </header>

      {/* La regla de la mesa: qué hay pendiente hoy, en tres lecturas. Es lo primero que
          mira quien se sienta a trabajar, así que va antes que cualquier panel. */}
      <dl className="mesa-regla">
        <div>
          <dt className="rotulo-carta">Reportes en cola</dt>
          <dd className="sonda">{reportes.data ? reportes.data.totalCount : '—'}</dd>
        </div>
        <div>
          <dt className="rotulo-carta">Propuestas por revisar</dt>
          <dd className="sonda">{propuestas.data ? propuestas.data.totalCount : '—'}</dd>
        </div>
        <div>
          <dt className="rotulo-carta">Colectores en pie</dt>
          <dd className={`sonda${colectoresCaidos > 0 ? ' mesa-regla-alerta' : ''}`}>
            {colectores.length > 0 ? `${colectores.length - colectoresCaidos}/${colectores.length}` : '—'}
          </dd>
        </div>
      </dl>

      {avisoDelError && (
        <div className="aviso-carta aviso-error" role="alert">
          <strong>{avisoDelError.titulo}</strong>
          <p>{avisoDelError.detalle}</p>
        </div>
      )}

      <div className="mesa-grid">
        <article className="hoja" aria-labelledby="titulo-moderacion">
          <header className="hoja-cabecera">
            <div>
              <p className="rotulo-carta hoja-fuente">RF018 · Correcciones ciudadanas</p>
              <h2 id="titulo-moderacion">Reportes pendientes</h2>
            </div>
            <button
              type="button"
              className="boton-carta boton-carta-icono"
              aria-label="Actualizar reportes"
              onClick={() => void reportes.refetch()}
            >
              <RefreshCw size={16} className={reportes.isFetching ? 'girando' : undefined} aria-hidden="true" />
            </button>
          </header>

          {moderar.isSuccess && moderar.variables && (
            <p className="aviso-carta aviso-hecho" role="status">
              {moderar.variables.decision === 'aprobar'
                ? 'Reporte aprobado. Ya cuenta para el estado de su barrio.'
                : 'Reporte descartado. No se publicará en la carta.'}
            </p>
          )}

          {reportes.isPending && <p className="hoja-cargando" role="status">Cargando la cola de reportes…</p>}

          {!reportes.isPending && reportes.data?.items.length === 0 && (
            <div className="hoja-vacia">
              <span className="hoja-vacia-marca" aria-hidden="true"><Check size={18} /></span>
              <strong>La cola está limpia</strong>
              <p>Todos los reportes que llegaron ya pasaron por tu revisión. Actualiza para traer los que entren después.</p>
            </div>
          )}

          {reportes.data && reportes.data.totalCount > reportes.data.items.length && (
            <p className="aviso-carta aviso-tope" role="status">
              Mostrando {reportes.data.items.length} de {reportes.data.totalCount} reportes pendientes — hay más de los que caben aquí. Modera estos y actualiza para traer los siguientes.
            </p>
          )}

          <div className="lista-correcciones">
            {reportes.data?.items.map((reporte) => (
              <article key={reporte.id} className="fila-correccion">
                <div className="correccion-cuerpo">
                  <strong className="rotulo-hidrografico correccion-lectura">{reporte.tipo.replaceAll('_', ' ')}</strong>
                  <p className="correccion-origen">{reporte.sectorId}</p>
                  <p className="correccion-pie"><span className="sonda">{fechaLegible(reporte.timestamp)}</span></p>
                </div>
                <div className="acciones-moderacion">
                  <button type="button" className="boton-carta boton-aprobar" disabled={moderar.isPending} onClick={() => moderar.mutate({ id: reporte.id, decision: 'aprobar' })}>
                    <Check size={15} aria-hidden="true" /> Aprobar
                  </button>
                  <button type="button" className="boton-carta boton-descartar" disabled={moderar.isPending} onClick={() => moderar.mutate({ id: reporte.id, decision: 'descartar' })}>
                    <X size={15} aria-hidden="true" /> Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="hoja" aria-labelledby="titulo-ingesta">
          <header className="hoja-cabecera">
            <div>
              <p className="rotulo-carta hoja-fuente">ADR-028 · Correcciones automáticas</p>
              <h2 id="titulo-ingesta">Propuestas de la ingesta</h2>
            </div>
            <button
              type="button"
              className="boton-carta boton-carta-icono"
              aria-label="Actualizar propuestas"
              onClick={() => void propuestas.refetch()}
            >
              <RefreshCw size={16} className={propuestas.isFetching ? 'girando' : undefined} aria-hidden="true" />
            </button>
          </header>

          <p className="nota-carta">
            La ingesta propone; el mapa no cambia hasta que tú apruebas. Compara el estado
            propuesto contra la cita del documento original antes de decidir.
          </p>

          {colectores.length > 0 && (
            <ul className="lista-colectores">
              {colectores.map((colector) => {
                const caido = colector.fallosConsecutivos >= 3
                return (
                  <li key={colector.nombre} className={caido ? 'colector colector-caido' : 'colector'} title={colector.motivoDelUltimoFallo ?? undefined}>
                    <span className="colector-marca" aria-hidden="true" />
                    <span className="colector-nombre">{colector.nombre}</span>
                    <span className="colector-estado">{caido ? 'caído' : 'operativo'}</span>
                  </li>
                )
              })}
            </ul>
          )}

          {revisarPropuesta.isSuccess && revisarPropuesta.variables && (
            <p className="aviso-carta aviso-hecho" role="status">
              {revisarPropuesta.variables.decision === 'aprobar'
                ? 'Propuesta aprobada. El estado ya está publicado en la carta.'
                : 'Propuesta descartada. La carta no se movió.'}
            </p>
          )}

          {propuestas.isPending && <p className="hoja-cargando" role="status">Cargando las propuestas…</p>}

          {!propuestas.isPending && propuestas.data?.items.length === 0 && (
            <div className="hoja-vacia">
              <span className="hoja-vacia-marca" aria-hidden="true"><Check size={18} /></span>
              <strong>Ninguna fuente propone cambios</strong>
              <p>Acuacar, los sensores y la prensa no han detectado nada nuevo. Cuando lo hagan, aparecerá aquí antes de tocar el mapa.</p>
            </div>
          )}

          {propuestas.data && propuestas.data.totalCount > propuestas.data.items.length && (
            <p className="aviso-carta aviso-tope" role="status">
              Mostrando {propuestas.data.items.length} de {propuestas.data.totalCount} propuestas — hay más de las que caben aquí. Revisa estas y actualiza para traer las siguientes.
            </p>
          )}

          <div className="lista-correcciones">
            {propuestas.data?.items.map((propuesta) => (
              <article key={propuesta.id} className="fila-correccion fila-propuesta">
                <div className="correccion-cuerpo">
                  <strong className="rotulo-hidrografico correccion-lectura">{propuesta.estadoPropuesto.replaceAll('_', ' ')}</strong>
                  <p className="correccion-origen">{propuesta.sectorId} · vía {propuesta.fuente}</p>
                  {/* La cita es la prueba: va en romana de la carta, no en la itálica
                      hidrográfica, porque es texto del documento y no una lectura del agua. */}
                  <blockquote className="cita-fuente">{propuesta.citaTextual}</blockquote>
                  <p className="correccion-pie">
                    <span className="sonda">{Math.round(propuesta.confianza * 100)}%</span> de confianza
                    <span className="correccion-pie-sep" aria-hidden="true">·</span>
                    <span className="sonda">{fechaLegible(propuesta.detectadaEn)}</span>
                  </p>
                </div>
                <div className="acciones-moderacion">
                  <button type="button" className="boton-carta boton-aprobar" disabled={revisarPropuesta.isPending} onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'aprobar' })}>
                    <Check size={15} aria-hidden="true" /> Aprobar
                  </button>
                  <button type="button" className="boton-carta boton-descartar" disabled={revisarPropuesta.isPending} onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'descartar' })}>
                    <X size={15} aria-hidden="true" /> Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>

      <div className="mesa-grid mesa-grid-cortes">
        <article className="hoja" aria-labelledby="titulo-cortes">
          <header className="hoja-cabecera">
            <div>
              <p className="rotulo-carta hoja-fuente">RF016–RF017 · Registro oficial</p>
              <h2 id="titulo-cortes">Cortes oficiales</h2>
            </div>
          </header>

          <div className="campo-carta">
            <label htmlFor="sector-cortes">Consultar barrio</label>
            <select id="sector-cortes" value={sectorFiltro} onChange={(event) => setSectorFiltro(event.target.value)}>
              <option value="">Selecciona un barrio</option>
              {barrios.map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
            </select>
          </div>

          {cerrarCorte.isSuccess && (
            <p className="aviso-carta aviso-hecho" role="status">Corte marcado como restablecido con la hora de ahora.</p>
          )}

          {cortes.isFetching && <p className="hoja-cargando" role="status">Consultando cortes…</p>}

          {/* Sin barrio elegido no hay nada que afirmar, y la carta tiene una convención
              exacta para eso: se trama en vez de pintarse (ADR-014). */}
          {!sectorFiltro && (
            <div className="hoja-vacia zona-sin-sondar">
              <strong>Todavía no has sondado nada</strong>
              <p>Elige un barrio arriba para ver sus cortes registrados y cuánto se cumplió lo prometido.</p>
            </div>
          )}

          {sectorFiltro && !cortes.isFetching && cortes.data?.length === 0 && (
            <div className="hoja-vacia">
              <strong>Este barrio no tiene cortes</strong>
              <p>Nadie ha registrado un corte oficial aquí. Si conoces uno, asiéntalo en «Registrar corte».</p>
            </div>
          )}

          <div className="lista-correcciones">
            {cortes.data?.map((corte) => {
              const vencida = promesaVencida(corte)
              const expandido = corteExpandidoId === corte.id
              return (
                <article key={corte.id} className="fila-correccion fila-corte">
                  <div className="correccion-cuerpo">
                    <strong className="correccion-lectura">{corte.causa}</strong>
                    <p className="correccion-origen">
                      <span className="marca-estado">{corte.estado}</span>
                      {vencida && <span className="marca-estado marca-vencida">Promesa vencida</span>}
                    </p>
                    <p className="correccion-pie">
                      Prometido: <span className="sonda">{fechaLegible(corte.finPrometido, 'sin fecha')}</span>
                    </p>
                  </div>

                  <div className="acciones-moderacion">
                    {corte.estado !== 'RESTABLECIDO' && corte.id && (
                      <button type="button" className="boton-carta" disabled={cerrarCorte.isPending} onClick={() => cerrarCorte.mutate(corte.id!)}>
                        Marcar restablecido
                      </button>
                    )}
                    {corte.id && (
                      <button
                        type="button"
                        className="boton-carta boton-carta-icono"
                        aria-label={expandido ? 'Ocultar detalle del corte' : 'Ver detalle del corte'}
                        aria-expanded={expandido}
                        onClick={() => setCorteExpandidoId((actual) => actual === corte.id ? null : corte.id!)}
                      >
                        {expandido ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                      </button>
                    )}
                  </div>

                  {expandido && (
                    <div className="corte-detalle">
                      {detalleCorte.isPending && <p className="hoja-cargando" role="status">Cargando detalle…</p>}
                      {detalleCorte.error && (
                        <p className="aviso-carta aviso-error" role="alert">{normalizarErrorApi(detalleCorte.error).detalle}</p>
                      )}
                      {detalleCorte.data && (
                        <dl className="corte-datos">
                          <div><dt>Inicio</dt><dd className="sonda">{fechaLegible(detalleCorte.data.inicio)}</dd></div>
                          <div><dt>Fin prometido</dt><dd className="sonda">{fechaLegible(detalleCorte.data.finPrometido)}</dd></div>
                          <div><dt>Hora real</dt><dd className="sonda">{fechaLegible(detalleCorte.data.finReal, 'Aún no se restablece')}</dd></div>
                          <div><dt>Origen</dt><dd>{detalleCorte.data.origen ?? '—'}</dd></div>
                        </dl>
                      )}

                      {corte.estado === 'RESTABLECIDO' && (
                        <div className="brecha-corte">
                          <p className="rotulo-carta">Prometido contra real</p>
                          {indiceCorte.isPending && <p className="hoja-cargando" role="status">Calculando el índice de cumplimiento…</p>}
                          {indiceCorte.error && (
                            <p className="aviso-carta aviso-error" role="alert">{normalizarErrorApi(indiceCorte.error).detalle}</p>
                          )}
                          {indiceCorte.data && (
                            <dl className={`brecha-cifras${indiceCorte.data.porcentajeCumplimiento < 100 ? ' brecha-incumplida' : ''}`}>
                              <div>
                                <dt>Prometidas</dt>
                                <dd className="sonda">{(indiceCorte.data.duracionPrometidaSegundos / 3600).toFixed(1)} h</dd>
                              </div>
                              <div>
                                <dt>Reales</dt>
                                <dd className="sonda">{(indiceCorte.data.duracionRealSegundos / 3600).toFixed(1)} h</dd>
                              </div>
                              <div>
                                <dt>Cumplimiento</dt>
                                <dd className="sonda">{indiceCorte.data.porcentajeCumplimiento.toFixed(0)}%</dd>
                              </div>
                            </dl>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </article>

        <article className="hoja hoja-asiento" aria-labelledby="titulo-crear-corte">
          <header className="hoja-cabecera">
            <div>
              <p className="rotulo-carta hoja-fuente">Asiento nuevo</p>
              <h2 id="titulo-crear-corte">Registrar corte</h2>
            </div>
          </header>

          {registrarCorte.isSuccess && (
            <p className="aviso-carta aviso-hecho" role="status">Corte registrado. Ya aparece en el historial del barrio.</p>
          )}

          <form onSubmit={crearCorte} className="formulario-asiento">
            <fieldset className="campo-carta campo-sectores">
              <legend>Barrios afectados</legend>
              <p className="campo-ayuda">
                Elegidos: <span className="sonda">{sectoresNuevos.length}</span> de <span className="sonda">{barrios.length}</span>
              </p>
              <div className="selector-sectores-corte">
                {barrios.map((sector) => (
                  <label key={sector.id}>
                    <input
                      type="checkbox"
                      checked={sectoresNuevos.includes(sector.id)}
                      onChange={(event) => setSectoresNuevos((actuales) => event.target.checked ? [...actuales, sector.id] : actuales.filter((id) => id !== sector.id))}
                    />
                    <span>{sector.nombre}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="campo-carta">
              <label>Inicio<input required type="datetime-local" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
            </div>
            <div className="campo-carta">
              <label>Fin prometido<input required type="datetime-local" value={finPrometido} onChange={(event) => setFinPrometido(event.target.value)} /></label>
            </div>
            <div className="campo-carta campo-causa">
              <label>Causa<input required value={causa} onChange={(event) => setCausa(event.target.value)} placeholder="Mantenimiento o daño reportado" /></label>
            </div>

            {/* La hora prometida es la que después se contrasta con la real: decirlo aquí
                es lo que hace que el índice de cumplimiento signifique algo (M6). */}
            <p className="nota-carta nota-asiento">
              El fin prometido queda registrado tal cual: es contra esa hora que se mide
              después el cumplimiento del corte.
            </p>

            <button className="boton-carta boton-asentar" type="submit" disabled={registrarCorte.isPending}>
              {registrarCorte.isPending ? 'Registrando…' : 'Registrar corte oficial'}
            </button>
          </form>
        </article>
      </div>
    </main>
  )
}
