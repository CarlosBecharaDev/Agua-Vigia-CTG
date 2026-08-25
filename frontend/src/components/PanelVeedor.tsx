import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Droplets,
  LogOut,
  Plus,
  Radar,
  RefreshCw,
  Scale,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'
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

interface Props {
  onCerrarSesion: () => void
}

function fechaLocalAISO(valor: string): string {
  return new Date(valor).toISOString()
}

export function PanelVeedor({ onCerrarSesion }: Props) {
  const queryClient = useQueryClient()
  const [sectorFiltro, setSectorFiltro] = useState('')
  const [busquedaBarrios, setBusquedaBarrios] = useState('')
  const [sectoresNuevos, setSectoresNuevos] = useState<string[]>([])
  const [inicio, setInicio] = useState('')
  const [finPrometido, setFinPrometido] = useState('')
  const [causa, setCausa] = useState('')
  const [errorVentanaCorte, setErrorVentanaCorte] = useState<string | null>(null)
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
      setErrorVentanaCorte(null)
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

  const barriosFiltrados = useMemo(() => {
    const q = busquedaBarrios.trim().toLowerCase()
    return q ? barrios.filter((b) => b.nombre.toLowerCase().includes(q)) : barrios
  }, [barrios, busquedaBarrios])

  const error =
    reportes.error ||
    sectores.error ||
    cortes.error ||
    moderar.error ||
    registrarCorte.error ||
    cerrarCorte.error ||
    propuestas.error ||
    revisarPropuesta.error

  const crearCorte = (event: FormEvent) => {
    event.preventDefault()
    if (sectoresNuevos.length === 0 || !inicio || !finPrometido || !causa.trim()) return
    if (fechaLocalAISO(finPrometido) <= fechaLocalAISO(inicio)) {
      setErrorVentanaCorte('El fin prometido debe ser posterior al inicio del corte.')
      return
    }
    setErrorVentanaCorte(null)
    registrarCorte.mutate({
      sectoresAfectados: sectoresNuevos,
      inicio: fechaLocalAISO(inicio),
      finPrometido: fechaLocalAISO(finPrometido),
      causa: causa.trim(),
    })
  }

  return (
    <main id="contenido-principal" tabIndex={-1} className="panel-veedor-root" aria-labelledby="titulo-panel-veedor">
      <div className="panel-veedor-contenedor">
        {/* Cabecera y Status */}
        <header className="panel-veedor-topbar">
          <div>
            <div className="panel-veedor-badge-activo">
              <span className="pulse-dot-green" />
              <span>SESIÓN DE VEEDURÍA ACTIVA</span>
            </div>
            <h1 id="titulo-panel-veedor" className="panel-veedor-titulo">
              Centro Operativo del Veedor
            </h1>
            <p className="panel-veedor-subtitulo">
              Modera reportes ciudadanos en tiempo real, audita cortes oficiales y supervisa la ingesta de datos.
            </p>
          </div>
          <button type="button" className="panel-veedor-btn-logout" onClick={onCerrarSesion}>
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </header>

        {error && (
          <div className="form-suscripcion-error-badge" style={{ marginBottom: '1.5rem' }} role="alert">
            {normalizarErrorApi(error).detalle}
          </div>
        )}

        {/* Bento Grid con las 4 Secciones Operativas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
          
          {/* 1. Moderación de Reportes */}
          <section id="moderacion" className="panel-veedor-seccion-card" aria-labelledby="titulo-moderacion" style={{ marginBottom: 0 }}>
            <div className="panel-veedor-seccion-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <ClipboardCheck size={18} color="#a855f7" />
                  <h2 id="titulo-moderacion">Reportes Pendientes</h2>
                </div>
                <p style={{ color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.82rem', margin: 0 }}>
                  Validación de incidencias ciudadanas.
                </p>
              </div>
              <button
                type="button"
                className="bitacora-actualizar-pro"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                aria-label="Actualizar reportes"
                onClick={() => void reportes.refetch()}
                disabled={reportes.isFetching}
              >
                <RefreshCw size={13} className={reportes.isFetching ? 'animate-spin' : ''} />
                Actualizar
              </button>
            </div>

            {reportes.isPending && <p style={{ color: '#94a3b8' }} role="status">Cargando reportes…</p>}
            {!reportes.isPending && reportes.data?.items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={36} color="#4ade80" style={{ margin: '0 auto 0.5rem' }} />
                <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.2rem' }}>Cola al día</strong>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>No hay reportes pendientes de moderación.</p>
              </div>
            )}
            {reportes.data && reportes.data.totalCount > reportes.data.items.length && (
              <p className="mensaje-error" role="alert" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
                Mostrando {reportes.data.items.length} de {reportes.data.totalCount} reportes pendientes — hay más de los que caben aquí.
              </p>
            )}

            <div className="lista-moderacion" style={{ display: 'grid', gap: '0.85rem' }}>
              {reportes.data?.items.map((reporte) => (
                <article key={reporte.id} className="tarjeta-moderacion-item" style={{ padding: '1rem' }}>
                  <div>
                    <div className="moderacion-cab">
                      <span className="moderacion-badge-tipo">
                        <AlertTriangle size={12} />
                        {reporte.tipo.replaceAll('_', ' ')}
                      </span>
                      <time className="moderacion-tiempo">
                        {new Date(reporte.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <strong style={{ color: '#f8fafc', fontSize: '1rem', display: 'block', marginBottom: '0.2rem' }}>
                      {reporte.sectorId}
                    </strong>
                    <small style={{ color: 'rgba(203, 213, 225, 0.6)' }}>
                      {new Date(reporte.timestamp).toLocaleDateString('es-CO')}
                    </small>
                  </div>

                  <div className="moderacion-acciones" style={{ marginTop: '0.85rem', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn-mod-aprobar"
                      disabled={moderar.isPending}
                      onClick={() => moderar.mutate({ id: reporte.id, decision: 'aprobar' })}
                    >
                      <Check size={14} /> Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn-mod-descartar"
                      disabled={moderar.isPending}
                      onClick={() => moderar.mutate({ id: reporte.id, decision: 'descartar' })}
                    >
                      <X size={14} /> Descartar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* 2. Cortes Oficiales */}
          <section id="cortes" className="panel-veedor-seccion-card" aria-labelledby="titulo-cortes" style={{ marginBottom: 0 }}>
            <div className="panel-veedor-seccion-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Droplets size={18} color="#38bdf8" />
                  <h2 id="titulo-cortes">Cortes Oficiales</h2>
                </div>
                <p style={{ color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.82rem', margin: 0 }}>
                  Auditoría y cierre de interrupciones.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="sector-cortes" className="form-reporte-label" style={{ marginBottom: '0.35rem' }}>
                Consultar barrio
              </label>
              <select
                id="sector-cortes"
                value={sectorFiltro}
                onChange={(event) => setSectorFiltro(event.target.value)}
                className="panel-veedor-input"
              >
                <option value="">Selecciona un barrio</option>
                {barrios.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.nombre}
                  </option>
                ))}
              </select>
            </div>

            {cortes.isFetching && <p style={{ color: '#94a3b8' }} role="status">Consultando cortes…</p>}
            {sectorFiltro && !cortes.isFetching && cortes.data?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={36} color="#4ade80" style={{ margin: '0 auto 0.5rem' }} />
                <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.2rem' }}>Sin cortes registrados</strong>
                <p style={{ margin: 0, fontSize: '0.82rem' }}>No existen cortes para este barrio.</p>
              </div>
            )}

            <div className="lista-cortes" style={{ display: 'grid', gap: '0.85rem' }}>
              {cortes.data?.map((corte) => (
                <article key={corte.id} className="corte-accordion-card">
                  <div className="corte-accordion-cab">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          className={`bitacora-badge-estado ${
                            corte.estado === 'RESTABLECIDO' ? 'badge-con-servicio' : 'badge-sin-servicio'
                          }`}
                        >
                          {corte.estado}
                        </span>
                        <strong style={{ fontSize: '0.98rem', color: '#f8fafc' }}>{corte.causa}</strong>
                      </div>
                      <small style={{ color: 'rgba(203, 213, 225, 0.65)', fontSize: '0.75rem' }}>
                        Prometido: {corte.finPrometido ? new Date(corte.finPrometido).toLocaleString('es-CO') : 'Sin fecha'}
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {corte.estado !== 'RESTABLECIDO' && corte.id && (
                        <button
                          type="button"
                          className="btn-mod-aprobar"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
                          disabled={cerrarCorte.isPending}
                          onClick={() => cerrarCorte.mutate(corte.id!)}
                        >
                          Marcar restablecido
                        </button>
                      )}
                      {corte.id && (
                        <button
                          type="button"
                          className="bitacora-actualizar-pro"
                          style={{ padding: '0.35rem 0.6rem' }}
                          aria-label={corteExpandidoId === corte.id ? 'Ocultar detalle del corte' : 'Ver detalle del corte'}
                          onClick={() => setCorteExpandidoId((actual) => (actual === corte.id ? null : corte.id!))}
                        >
                          {corteExpandidoId === corte.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {corteExpandidoId === corte.id && (
                    <div className="corte-accordion-detalles">
                      {detalleCorte.isPending && <p style={{ color: '#94a3b8' }}>Cargando detalle…</p>}
                      {detalleCorte.error && <p className="mensaje-error" role="alert">{normalizarErrorApi(detalleCorte.error).detalle}</p>}
                      {detalleCorte.data && (
                        <>
                          <div>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Inicio</span>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
                              {detalleCorte.data.inicio ? new Date(detalleCorte.data.inicio).toLocaleString('es-CO') : '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Fin prometido</span>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
                              {detalleCorte.data.finPrometido ? new Date(detalleCorte.data.finPrometido).toLocaleString('es-CO') : '—'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Hora real</span>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>
                              {detalleCorte.data.finReal ? new Date(detalleCorte.data.finReal).toLocaleString('es-CO') : 'Aún no se restablece'}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Origen</span>
                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>{detalleCorte.data.origen ?? '—'}</div>
                          </div>
                        </>
                      )}

                      {corte.estado === 'RESTABLECIDO' && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '0.65rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Scale size={15} color="#d8b4fe" />
                          {indiceCorte.isPending && <span>Calculando índice de cumplimiento…</span>}
                          {indiceCorte.error && <span className="mensaje-error">{normalizarErrorApi(indiceCorte.error).detalle}</span>}
                          {indiceCorte.data && (
                            <span style={{ fontSize: '0.82rem', color: '#f1f5f9' }}>
                              Cumplimiento: <strong style={{ color: '#d8b4fe' }}>{indiceCorte.data.porcentajeCumplimiento.toFixed(0)}%</strong>
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
          </section>
        </div>

        {/* 3. Registrar Nuevo Corte */}
        <section id="nuevo-corte" className="panel-veedor-seccion-card" aria-labelledby="titulo-crear-corte">
          <div className="panel-veedor-seccion-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Plus size={18} color="#4ade80" />
                <h2 id="titulo-crear-corte">Registrar corte</h2>
              </div>
              <p style={{ color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.85rem', margin: 0 }}>
                Nuevo registro oficial con trazabilidad y cálculo de cumplimiento.
              </p>
            </div>
          </div>

          <form onSubmit={crearCorte} style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-reporte-label">
                  Barrios afectados ({sectoresNuevos.length} seleccionados)
                </label>
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Filtrar barrio…"
                    value={busquedaBarrios}
                    onChange={(e) => setBusquedaBarrios(e.target.value)}
                    className="panel-veedor-input"
                    style={{ paddingLeft: '2rem', paddingRight: '0.5rem', fontSize: '0.78rem', minHeight: '34px' }}
                  />
                </div>
              </div>

              <div className="selector-sectores-corte panel-veedor-multiselect-grid">
                {barriosFiltrados.map((sector) => (
                  <label key={sector.id} className="panel-veedor-checkbox-label">
                    <input
                      type="checkbox"
                      aria-label={sector.nombre}
                      checked={sectoresNuevos.includes(sector.id)}
                      onChange={(event) =>
                        setSectoresNuevos((actuales) =>
                          event.target.checked ? [...actuales, sector.id] : actuales.filter((id) => id !== sector.id),
                        )
                      }
                    />
                    <span>{sector.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label htmlFor="inicio-corte" className="form-reporte-label" style={{ marginBottom: '0.35rem' }}>
                  <Clock size={14} color="#38bdf8" /> Inicio
                </label>
                <input
                  id="inicio-corte"
                  required
                  type="datetime-local"
                  value={inicio}
                  onChange={(event) => { setInicio(event.target.value); setErrorVentanaCorte(null) }}
                  className="panel-veedor-input"
                />
              </div>

              <div>
                <label htmlFor="fin-prometido-corte" className="form-reporte-label" style={{ marginBottom: '0.35rem' }}>
                  <Clock size={14} color="#d8b4fe" /> Fin prometido
                </label>
                <input
                  id="fin-prometido-corte"
                  required
                  type="datetime-local"
                  value={finPrometido}
                  onChange={(event) => { setFinPrometido(event.target.value); setErrorVentanaCorte(null) }}
                  className="panel-veedor-input"
                />
              </div>
            </div>

            {errorVentanaCorte && (
              <div className="form-suscripcion-error-badge" role="alert">
                {errorVentanaCorte}
              </div>
            )}

            <div>
              <label htmlFor="causa-corte" className="form-reporte-label" style={{ marginBottom: '0.35rem' }}>
                Causa
              </label>
              <input
                id="causa-corte"
                required
                value={causa}
                onChange={(event) => setCausa(event.target.value)}
                placeholder="Mantenimiento o daño reportado"
                className="panel-veedor-input"
              />
            </div>

            <button
              className="form-suscripcion-boton-enviar"
              type="submit"
              disabled={registrarCorte.isPending || sectoresNuevos.length === 0}
              style={{ maxWidth: '280px', marginTop: '0.5rem' }}
            >
              {registrarCorte.isPending ? <><span className="spinner" /> Registrando…</> : 'Registrar corte oficial'}
            </button>
          </form>
        </section>

        {/* 4. Radar Ingesta (IA) */}
        <section id="radar-ia" className="panel-veedor-seccion-card" aria-labelledby="titulo-ingesta">
          <div className="panel-veedor-seccion-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Radar size={18} color="#a855f7" />
                <h2 id="titulo-ingesta">Propuestas de la ingesta automatizada</h2>
              </div>
              <p style={{ color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.85rem', margin: 0 }}>
                La ingesta (Acuacar, IoT, prensa) solo propone — el mapa no cambia hasta que un veedor
                aprueba, comparando el estado propuesto contra la cita textual del documento original.
              </p>
            </div>
            <button
              type="button"
              className="bitacora-actualizar-pro"
              aria-label="Actualizar propuestas"
              onClick={() => void propuestas.refetch()}
              disabled={propuestas.isFetching}
            >
              <RefreshCw size={14} className={propuestas.isFetching ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {/* Salud de Colectores */}
          {saludIngesta.data && saludIngesta.data.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {saludIngesta.data.map((colector) => (
                <span
                  key={colector.nombre}
                  className="bitacora-fuente estadisticas-badge-status"
                  title={colector.motivoDelUltimoFallo ?? undefined}
                >
                  <Activity
                    size={13}
                    color={colector.fallosConsecutivos >= 3 ? '#f87171' : '#4ade80'}
                    aria-hidden="true"
                  />
                  {colector.nombre}: {colector.fallosConsecutivos >= 3 ? 'caído' : 'operativo'}
                </span>
              ))}
            </div>
          )}

          {propuestas.isPending && (
            <p style={{ color: '#94a3b8', padding: '2rem 0', textAlign: 'center' }} role="status">
              Cargando propuestas…
            </p>
          )}

          {!propuestas.isPending && propuestas.data?.items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <CheckCircle2 size={40} color="#4ade80" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ color: '#f8fafc', margin: '0 0 0.25rem' }}>Cola al día</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No hay propuestas pendientes de revisión.</p>
            </div>
          )}

          {propuestas.data && propuestas.data.totalCount > propuestas.data.items.length && (
            <p className="mensaje-error" role="alert" style={{ marginBottom: '1rem', fontSize: '0.82rem' }}>
              Mostrando {propuestas.data.items.length} de {propuestas.data.totalCount} propuestas — hay más de las que caben aquí.
            </p>
          )}

          <div className="lista-moderacion panel-veedor-grid-items">
            {propuestas.data?.items.map((propuesta) => (
              <article key={propuesta.id} className="tarjeta-moderacion-item">
                <div>
                  <div className="moderacion-cab">
                    <span className="moderacion-badge-tipo" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#bfdbfe', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                      {propuesta.estadoPropuesto.replaceAll('_', ' ')}
                    </span>
                    <span className="estadisticas-badge-status" style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                      {Math.round(propuesta.confianza * 100)}% confianza
                    </span>
                  </div>

                  <strong style={{ color: '#f8fafc', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                    {propuesta.sectorId} — vía {propuesta.fuente}
                  </strong>
                  <small style={{ color: 'rgba(203, 213, 225, 0.6)', display: 'block', marginBottom: '0.5rem' }}>
                    {new Date(propuesta.detectadaEn).toLocaleString('es-CO')}
                  </small>

                  <blockquote style={{ margin: 0, padding: '0.65rem', background: 'rgba(0, 0, 0, 0.25)', borderLeft: '3px solid #a855f7', borderRadius: '0 8px 8px 0', fontSize: '0.78rem', fontStyle: 'italic', color: '#e2e8f0' }}>
                    "{propuesta.citaTextual}"
                  </blockquote>
                </div>

                <div className="moderacion-acciones">
                  <button
                    type="button"
                    className="btn-mod-aprobar"
                    disabled={revisarPropuesta.isPending}
                    onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'aprobar' })}
                  >
                    <Check size={15} /> Aprobar
                  </button>
                  <button
                    type="button"
                    className="btn-mod-descartar"
                    disabled={revisarPropuesta.isPending}
                    onClick={() => revisarPropuesta.mutate({ id: propuesta.id, decision: 'descartar' })}
                  >
                    <X size={15} /> Descartar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
