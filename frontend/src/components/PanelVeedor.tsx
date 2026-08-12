import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, Check, ChevronDown, ChevronUp, ClipboardCheck, Droplets, LogOut, Plus, Radar, RefreshCw, Scale, X } from 'lucide-react'
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
import { normalizarErrorApi } from '../api/client'
import './PanelVeedor.css'

interface Props { onCerrarSesion: () => void }

function fechaLocalAISO(valor: string): string {
  return new Date(valor).toISOString()
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

  const crearCorte = (event: FormEvent) => {
    event.preventDefault()
    if (sectoresNuevos.length === 0 || !inicio || !finPrometido || !causa.trim()) return
    registrarCorte.mutate({ sectoresAfectados: sectoresNuevos, inicio: fechaLocalAISO(inicio), finPrometido: fechaLocalAISO(finPrometido), causa: causa.trim() })
  }

  return (
    <main id="contenido-principal" tabIndex={-1} className="panel-veedor" aria-labelledby="titulo-panel-veedor">
      <header className="panel-veedor-cabecera">
        <div><p className="eyebrow">Operación protegida</p><h1 id="titulo-panel-veedor">Centro operativo del veedor</h1><p>Modera reportes ciudadanos y administra cortes oficiales con trazabilidad.</p></div>
        <button type="button" className="boton boton-secundario" onClick={onCerrarSesion}><LogOut size={17} /> Cerrar sesión</button>
      </header>

      {error && <p className="mensaje-error panel-veedor-error" role="alert">{normalizarErrorApi(error).detalle}</p>}

      <section className="panel-veedor-grid">
        <article className="panel-operativo" aria-labelledby="titulo-moderacion">
          <header><span className="panel-icono"><ClipboardCheck /></span><div><p className="eyebrow">RF018</p><h2 id="titulo-moderacion">Reportes pendientes</h2></div><button type="button" className="boton-icono" aria-label="Actualizar reportes" onClick={() => void reportes.refetch()}><RefreshCw size={17} /></button></header>
          {reportes.isPending && <p role="status">Cargando reportes…</p>}
          {!reportes.isPending && reportes.data?.items.length === 0 && <div className="panel-vacio"><Check /><strong>Cola al día</strong><p>No hay reportes pendientes de moderación.</p></div>}
          {reportes.data && reportes.data.totalCount > reportes.data.items.length && (
            <p className="mensaje-error" role="alert">
              Mostrando {reportes.data.items.length} de {reportes.data.totalCount} reportes pendientes — hay más de los que caben aquí.
            </p>
          )}
          <div className="lista-moderacion">
            {reportes.data?.items.map((reporte) => (
              <article key={reporte.id} className="reporte-pendiente">
                <div><strong>{reporte.tipo.replaceAll('_', ' ')}</strong><span>{reporte.sectorId}</span><small>{new Date(reporte.timestamp).toLocaleString('es-CO')}</small></div>
                <div className="acciones-moderacion">
                  <button type="button" className="boton aprobar" disabled={moderar.isPending} onClick={() => moderar.mutate({ id: reporte.id, decision: 'aprobar' })}><Check size={16} /> Aprobar</button>
                  <button type="button" className="boton descartar" disabled={moderar.isPending} onClick={() => moderar.mutate({ id: reporte.id, decision: 'descartar' })}><X size={16} /> Descartar</button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel-operativo" aria-labelledby="titulo-cortes">
          <header><span className="panel-icono"><Droplets /></span><div><p className="eyebrow">RF016–RF017</p><h2 id="titulo-cortes">Cortes oficiales</h2></div></header>
          <label htmlFor="sector-cortes">Consultar barrio</label>
          <select id="sector-cortes" value={sectorFiltro} onChange={(event) => setSectorFiltro(event.target.value)}><option value="">Selecciona un barrio</option>{barrios.map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}</select>
          {cortes.isFetching && <p role="status">Consultando cortes…</p>}
          {sectorFiltro && !cortes.isFetching && cortes.data?.length === 0 && <div className="panel-vacio"><Check /><strong>Sin cortes registrados</strong><p>No existen cortes para este barrio.</p></div>}
          <div className="lista-cortes">
            {cortes.data?.map((corte) => (
              <article key={corte.id} className="corte-oficial">
                <div>
                  <strong>{corte.causa}</strong><span>{corte.estado}</span>
                  <small>Prometido: {corte.finPrometido ? new Date(corte.finPrometido).toLocaleString('es-CO') : 'Sin fecha'}</small>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {corte.estado !== 'RESTABLECIDO' && corte.id && <button type="button" className="boton boton-secundario" disabled={cerrarCorte.isPending} onClick={() => cerrarCorte.mutate(corte.id!)}>Marcar restablecido</button>}
                  {corte.id && (
                    <button
                      type="button"
                      className="boton-icono"
                      aria-label={corteExpandidoId === corte.id ? 'Ocultar detalle del corte' : 'Ver detalle del corte'}
                      onClick={() => setCorteExpandidoId((actual) => actual === corte.id ? null : corte.id!)}
                    >
                      {corteExpandidoId === corte.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>
                  )}
                </div>
                {corteExpandidoId === corte.id && (
                  <div className="corte-oficial-detalle">
                    {detalleCorte.isPending && <p role="status">Cargando detalle…</p>}
                    {detalleCorte.error && <p className="mensaje-error" role="alert">{normalizarErrorApi(detalleCorte.error).detalle}</p>}
                    {detalleCorte.data && (
                      <dl>
                        <dt>Inicio</dt><dd>{detalleCorte.data.inicio ? new Date(detalleCorte.data.inicio).toLocaleString('es-CO') : '—'}</dd>
                        <dt>Fin prometido</dt><dd>{detalleCorte.data.finPrometido ? new Date(detalleCorte.data.finPrometido).toLocaleString('es-CO') : '—'}</dd>
                        <dt>Hora real</dt><dd>{detalleCorte.data.finReal ? new Date(detalleCorte.data.finReal).toLocaleString('es-CO') : 'Aún no se restablece'}</dd>
                        <dt>Origen</dt><dd>{detalleCorte.data.origen ?? '—'}</dd>
                      </dl>
                    )}
                    {corte.estado === 'RESTABLECIDO' && (
                      <div className="corte-oficial-indice">
                        <Scale size={14} aria-hidden="true" />
                        {indiceCorte.isPending && <span>Calculando índice de cumplimiento…</span>}
                        {indiceCorte.error && <span className="mensaje-error">{normalizarErrorApi(indiceCorte.error).detalle}</span>}
                        {indiceCorte.data && (
                          <span>
                            Cumplimiento: <strong>{indiceCorte.data.porcentajeCumplimiento.toFixed(0)}%</strong>
                            {' '}({(indiceCorte.data.duracionPrometidaSegundos / 3600).toFixed(1)} h prometidas vs.{' '}
                            {(indiceCorte.data.duracionRealSegundos / 3600).toFixed(1)} h reales)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel-operativo crear-corte" aria-labelledby="titulo-crear-corte">
        <header><span className="panel-icono"><Plus /></span><div><p className="eyebrow">Nuevo registro oficial</p><h2 id="titulo-crear-corte">Registrar corte</h2></div></header>
        <form onSubmit={crearCorte}>
          <fieldset className="campo-sectores">
            <legend>Barrios afectados</legend>
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
          <label>Inicio<input required type="datetime-local" value={inicio} onChange={(event) => setInicio(event.target.value)} /></label>
          <label>Fin prometido<input required type="datetime-local" value={finPrometido} onChange={(event) => setFinPrometido(event.target.value)} /></label>
          <label className="campo-causa">Causa<input required value={causa} onChange={(event) => setCausa(event.target.value)} placeholder="Mantenimiento o daño reportado" /></label>
          <button className="boton boton-primario" type="submit" disabled={registrarCorte.isPending}>{registrarCorte.isPending ? 'Registrando…' : 'Registrar corte oficial'}</button>
        </form>
      </section>

      <section className="panel-operativo" aria-labelledby="titulo-ingesta">
        <header>
          <span className="panel-icono"><Radar /></span>
          <div><p className="eyebrow">M9 — ADR-028</p><h2 id="titulo-ingesta">Propuestas de la ingesta automatizada</h2></div>
          <button type="button" className="boton-icono" aria-label="Actualizar propuestas" onClick={() => void propuestas.refetch()}><RefreshCw size={17} /></button>
        </header>
        <p>
          La ingesta (Acuacar, IoT, prensa) solo propone — el mapa no cambia hasta que un veedor
          aprueba, comparando el estado propuesto contra la cita textual del documento original.
        </p>

        {saludIngesta.data && saludIngesta.data.length > 0 && (
          <div className="lista-salud-ingesta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.5rem 0 1rem' }}>
            {saludIngesta.data.map((colector) => (
              <span
                key={colector.nombre}
                className="bitacora-fuente"
                title={colector.motivoDelUltimoFallo ?? undefined}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Activity size={13} color={colector.fallosConsecutivos >= 3 ? 'var(--color-estado-sin)' : 'var(--color-estado-con)'} aria-hidden="true" />
                {colector.nombre}: {colector.fallosConsecutivos >= 3 ? 'caído' : 'operativo'}
              </span>
            ))}
          </div>
        )}

        {propuestas.isPending && <p role="status">Cargando propuestas…</p>}
        {!propuestas.isPending && propuestas.data?.items.length === 0 && <div className="panel-vacio"><Check /><strong>Cola al día</strong><p>No hay propuestas pendientes de revisión.</p></div>}
        {propuestas.data && propuestas.data.totalCount > propuestas.data.items.length && (
          <p className="mensaje-error" role="alert">
            Mostrando {propuestas.data.items.length} de {propuestas.data.totalCount} propuestas — hay más de las que caben aquí.
          </p>
        )}
        <div className="lista-moderacion">
          {propuestas.data?.items.map((propuesta) => (
            <article key={propuesta.id} className="reporte-pendiente">
              <div>
                <strong>{propuesta.estadoPropuesto.replaceAll('_', ' ')}</strong>
                <span>{propuesta.sectorId} — vía {propuesta.fuente} ({Math.round(propuesta.confianza * 100)}% confianza)</span>
                <small style={{ display: 'block', fontStyle: 'italic', margin: '0.3rem 0' }}>"{propuesta.citaTextual}"</small>
                <small>{new Date(propuesta.detectadaEn).toLocaleString('es-CO')}</small>
              </div>
              <div className="acciones-moderacion">
                <button type="button" className="boton aprobar" disabled={revisarPropuesta.isPending} onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'aprobar' })}><Check size={16} /> Aprobar</button>
                <button type="button" className="boton descartar" disabled={revisarPropuesta.isPending} onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'descartar' })}><X size={16} /> Descartar</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
