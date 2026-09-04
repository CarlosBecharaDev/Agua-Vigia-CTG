import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesionVeedor } from '../hooks/useSesionVeedor'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronUp, ClipboardCheck, Clock, Droplets, Inbox, LogOut, Plus, Radar, RefreshCw, Scale, Search, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import type { Permiso } from '../api/client'
import './PanelVeedor.css'
import './Cuentas.css'

interface Props {
  onCerrarSesion: () => void
}

/** Lo que se muestra cuando todavía no hay con qué contar. Nunca un cero: un cero afirma que la
 *  cola está vacía, y no saberlo es distinto de saber que no hay nada. */
const SIN_DATOS = '—'

type Area = 'moderacion' | 'cortes' | 'ingesta'

/**
 * Las tres áreas del panel, cada una con el permiso que la habilita. El orden es el del trabajo
 * diario: primero lo que espera decisión humana, luego lo oficial, al final lo que propone la
 * máquina.
 */
const AREAS: { id: Area; etiqueta: string; icono: LucideIcon; permiso: Permiso }[] = [
  { id: 'moderacion', etiqueta: 'Reportes', icono: ClipboardCheck, permiso: 'MODERAR_REPORTES' },
  { id: 'cortes', etiqueta: 'Cortes oficiales', icono: Droplets, permiso: 'GESTIONAR_CORTES' },
  { id: 'ingesta', etiqueta: 'Ingesta', icono: Radar, permiso: 'REVISAR_INGESTA' },
]

function fechaLocalAISO(valor: string): string {
  return new Date(valor).toISOString()
}

export function PanelVeedor({ onCerrarSesion }: Props) {
  const { puede } = useSesionVeedor()
  const queryClient = useQueryClient()
  const [sectorFiltro, setSectorFiltro] = useState('')
  const [busquedaBarrios, setBusquedaBarrios] = useState('')
  const [sectoresNuevos, setSectoresNuevos] = useState<string[]>([])
  const [inicio, setInicio] = useState('')
  const [finPrometido, setFinPrometido] = useState('')
  const [causa, setCausa] = useState('')
  const [errorVentanaCorte, setErrorVentanaCorte] = useState<string | null>(null)
  const [corteExpandidoId, setCorteExpandidoId] = useState<string | null>(null)

  const areasVisibles = useMemo(() => AREAS.filter((area) => puede(area.permiso)), [puede])
  const [areaElegida, setAreaElegida] = useState<Area | null>(null)
  const area = areaElegida ?? areasVisibles[0]?.id ?? null

  // `enabled` por permiso y no solo por pintado: un OBSERVADOR que solo tiene VER_PANEL recibiría
  // un 403 por cada cola si se consultaran igual, y el panel abriría con un muro de errores rojos
  // que no son un fallo de nada.
  const reportes = useQuery({
    queryKey: ['veedor', 'reportes', 'pendientes'],
    queryFn: listarReportesPendientes,
    enabled: puede('MODERAR_REPORTES'),
  })
  const propuestas = useQuery({
    queryKey: ['veedor', 'ingesta', 'propuestas'],
    queryFn: listarPropuestasIngesta,
    enabled: puede('REVISAR_INGESTA'),
  })
  const saludIngesta = useQuery({
    queryKey: ['veedor', 'ingesta', 'salud'],
    queryFn: obtenerSaludIngesta,
    enabled: puede('REVISAR_INGESTA'),
  })
  const sectores = useQuery({ queryKey: ['sectores'], queryFn: obtenerSectores })
  const cortes = useQuery({
    queryKey: ['veedor', 'cortes', sectorFiltro],
    queryFn: () => listarCortesPorSector(sectorFiltro),
    enabled: Boolean(sectorFiltro) && puede('GESTIONAR_CORTES'),
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

  /** El backend identifica los sectores por id (`manga`); quien modera piensa en nombres. */
  const nombreDeSector = useMemo(() => {
    const porId = new Map(barrios.map((sector) => [sector.id, sector.nombre]))
    return (id: string) => porId.get(id) ?? id
  }, [barrios])

  const barriosFiltrados = useMemo(() => {
    const q = busquedaBarrios.trim().toLowerCase()
    return q ? barrios.filter((b) => b.nombre.toLowerCase().includes(q)) : barrios
  }, [barrios, busquedaBarrios])

  const cortesAbiertos = cortes.data?.filter((corte) => corte.estado !== 'RESTABLECIDO').length
  const colectoresOperativos = saludIngesta.data?.filter((c) => c.fallosConsecutivos < 3).length

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

  const kpis: { titulo: string; valor: string; sub: string; Icono: LucideIcon; color: string }[] = [
    {
      titulo: 'Reportes por moderar',
      valor: puede('MODERAR_REPORTES') ? (reportes.data ? String(reportes.data.totalCount) : SIN_DATOS) : SIN_DATOS,
      sub: puede('MODERAR_REPORTES') ? 'Vecinos esperando validación' : 'Tu cuenta no modera reportes',
      Icono: ClipboardCheck,
      color: '#a855f7',
    },
    {
      titulo: 'Propuestas por revisar',
      valor: puede('REVISAR_INGESTA') ? (propuestas.data ? String(propuestas.data.totalCount) : SIN_DATOS) : SIN_DATOS,
      sub: puede('REVISAR_INGESTA') ? 'La ingesta propone, no publica' : 'Tu cuenta no revisa la ingesta',
      Icono: Radar,
      color: '#38bdf8',
    },
    {
      titulo: 'Cortes abiertos',
      valor: sectorFiltro && cortesAbiertos !== undefined ? String(cortesAbiertos) : SIN_DATOS,
      sub: sectorFiltro ? `En ${nombreDeSector(sectorFiltro)}` : 'Elige un barrio en Cortes oficiales',
      Icono: Droplets,
      color: '#4ade80',
    },
    {
      titulo: 'Colectores operativos',
      valor:
        colectoresOperativos !== undefined && saludIngesta.data
          ? `${colectoresOperativos}/${saludIngesta.data.length}`
          : SIN_DATOS,
      sub: 'Acuacar, prensa e IoT',
      Icono: Activity,
      color: '#f59e0b',
    },
  ]

  const contadorDeArea = (id: Area): number | null => {
    if (id === 'moderacion') return reportes.data?.totalCount ?? null
    if (id === 'ingesta') return propuestas.data?.totalCount ?? null
    return null
  }

  return (
    <main id="contenido-principal" tabIndex={-1} className="panel-veedor-root" aria-labelledby="titulo-panel-veedor">
      <div className="panel-veedor-contenedor">
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
          <div className="panel-veedor-acciones-cab">
            {/* Solo se pinta para quien puede: si el frontend se equivocara, el backend responde
                403 igual — esto decide qué se muestra, no qué se permite. */}
            {puede('GESTIONAR_USUARIOS') && (
              <Link to="/veedor/cuentas" className="cuentas-btn cuentas-btn-principal">
                <Users size={15} /> Cuentas y permisos
              </Link>
            )}
            <button type="button" className="panel-veedor-btn-logout" onClick={onCerrarSesion}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </header>

        {error && (
          <div className="form-suscripcion-error-badge panel-veedor-error" role="alert">
            {normalizarErrorApi(error).detalle}
          </div>
        )}

        {/* Cuánto trabajo hay encima, antes de abrir ninguna cola. */}
        <section className="panel-veedor-stats-bar" aria-label="Resumen de la operación">
          {kpis.map((kpi) => (
            <article key={kpi.titulo} className="panel-veedor-stat-item">
              <span className="panel-veedor-kpi-icono" style={{ color: kpi.color }} aria-hidden="true">
                <kpi.Icono size={18} />
              </span>
              <div>
                <span className="panel-veedor-kpi-titulo">{kpi.titulo}</span>
                <strong className="panel-veedor-kpi-valor tabular">{kpi.valor}</strong>
                <span className="panel-veedor-kpi-sub">{kpi.sub}</span>
              </div>
            </article>
          ))}
        </section>

        {areasVisibles.length === 0 ? (
          <section className="panel-veedor-seccion-card">
            <div className="panel-veedor-vacio">
              <Inbox size={38} color="#94a3b8" aria-hidden="true" />
              <strong>Tu cuenta todavía no tiene colas asignadas</strong>
              <p>
                Puedes ver el panel, pero moderar reportes, registrar cortes o revisar la ingesta
                exige permisos que un administrador debe concederte.
              </p>
            </div>
          </section>
        ) : (
          <>
            <nav className="panel-veedor-tabs" aria-label="Áreas del panel">
              {areasVisibles.map(({ id, etiqueta, icono: Icono }) => {
                const contador = contadorDeArea(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`panel-veedor-tab-btn ${area === id ? 'is-active' : ''}`}
                    aria-current={area === id ? 'page' : undefined}
                    onClick={() => setAreaElegida(id)}
                  >
                    <Icono size={16} aria-hidden="true" />
                    {etiqueta}
                    {contador !== null && contador > 0 && (
                      <span className="panel-veedor-tab-badge">{contador}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            {area === 'moderacion' && (
              <section id="moderacion" className="panel-veedor-seccion-card" aria-labelledby="titulo-moderacion">
                <div className="panel-veedor-seccion-header">
                  <div>
                    <div className="panel-veedor-seccion-titulo">
                      <ClipboardCheck size={18} color="#a855f7" aria-hidden="true" />
                      <h2 id="titulo-moderacion">Reportes pendientes</h2>
                    </div>
                    <p className="panel-veedor-seccion-desc">
                      Cada reporte nace sin moderar. Aprobarlo lo hace contar; descartarlo lo retira.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bitacora-actualizar-pro panel-veedor-btn-actualizar"
                    aria-label="Actualizar reportes"
                    onClick={() => void reportes.refetch()}
                    disabled={reportes.isFetching}
                  >
                    <RefreshCw size={13} className={reportes.isFetching ? 'animate-spin' : ''} />
                    Actualizar
                  </button>
                </div>

                {reportes.isPending && <p className="panel-veedor-cargando" role="status">Cargando reportes…</p>}
                {!reportes.isPending && reportes.data?.items.length === 0 && (
                  <div className="panel-veedor-vacio">
                    <CheckCircle2 size={36} color="#4ade80" aria-hidden="true" />
                    <strong>Cola al día</strong>
                    <p>No hay reportes pendientes de moderación.</p>
                  </div>
                )}
                {reportes.data && reportes.data.totalCount > reportes.data.items.length && (
                  <p className="mensaje-error panel-veedor-aviso-truncado" role="alert">
                    Mostrando {reportes.data.items.length} de {reportes.data.totalCount} reportes pendientes — hay más de los que caben aquí.
                  </p>
                )}

                <div className="lista-moderacion panel-veedor-grid-items">
                  {reportes.data?.items.map((reporte) => (
                    <article key={reporte.id} className="tarjeta-moderacion-item">
                      <div>
                        <div className="moderacion-cab">
                          <span className="moderacion-badge-tipo">
                            <AlertTriangle size={12} aria-hidden="true" />
                            {reporte.tipo.replaceAll('_', ' ')}
                          </span>
                          <time className="moderacion-tiempo" dateTime={reporte.timestamp}>
                            {new Date(reporte.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                        <strong className="moderacion-sector">{nombreDeSector(reporte.sectorId)}</strong>
                        <small className="panel-veedor-tenue">
                          {new Date(reporte.timestamp).toLocaleDateString('es-CO')}
                        </small>
                      </div>

                      <div className="moderacion-acciones">
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
            )}

            {area === 'cortes' && (
              <>
                <section id="cortes" className="panel-veedor-seccion-card" aria-labelledby="titulo-cortes">
                  <div className="panel-veedor-seccion-header">
                    <div>
                      <div className="panel-veedor-seccion-titulo">
                        <Droplets size={18} color="#38bdf8" aria-hidden="true" />
                        <h2 id="titulo-cortes">Cortes oficiales</h2>
                      </div>
                      <p className="panel-veedor-seccion-desc">
                        Cerrar un corte con su hora real es lo que permite calcular el Índice de Cumplimiento.
                      </p>
                    </div>
                  </div>

                  <div className="panel-veedor-campo">
                    <label htmlFor="sector-cortes" className="form-reporte-label">
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

                  {!sectorFiltro && (
                    <div className="panel-veedor-vacio">
                      <Droplets size={36} color="#38bdf8" aria-hidden="true" />
                      <strong>Elige un barrio</strong>
                      <p>Los cortes se consultan por barrio: son 213 y listarlos todos no ayudaría a decidir.</p>
                    </div>
                  )}
                  {cortes.isFetching && <p className="panel-veedor-cargando" role="status">Consultando cortes…</p>}
                  {sectorFiltro && !cortes.isFetching && cortes.data?.length === 0 && (
                    <div className="panel-veedor-vacio">
                      <CheckCircle2 size={36} color="#4ade80" aria-hidden="true" />
                      <strong>Sin cortes registrados</strong>
                      <p>No existen cortes para {nombreDeSector(sectorFiltro)}.</p>
                    </div>
                  )}

                  <div className="lista-cortes panel-veedor-lista">
                    {cortes.data?.map((corte) => (
                      <article key={corte.id} className="corte-accordion-card">
                        <div className="corte-accordion-cab">
                          <div>
                            <div className="corte-accordion-titulo">
                              <span
                                className={`bitacora-badge-estado ${
                                  corte.estado === 'RESTABLECIDO' ? 'badge-con-servicio' : 'badge-sin-servicio'
                                }`}
                              >
                                {corte.estado}
                              </span>
                              <strong>{corte.causa}</strong>
                            </div>
                            <small className="panel-veedor-tenue">
                              Prometido: {corte.finPrometido ? new Date(corte.finPrometido).toLocaleString('es-CO') : 'Sin fecha'}
                            </small>
                          </div>

                          <div className="corte-accordion-acciones">
                            {corte.estado !== 'RESTABLECIDO' && corte.id && (
                              <button
                                type="button"
                                className="btn-mod-aprobar btn-compacto"
                                disabled={cerrarCorte.isPending}
                                onClick={() => cerrarCorte.mutate(corte.id!)}
                              >
                                Marcar restablecido
                              </button>
                            )}
                            {corte.id && (
                              <button
                                type="button"
                                className="bitacora-actualizar-pro btn-compacto"
                                aria-expanded={corteExpandidoId === corte.id}
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
                            {detalleCorte.isPending && <p className="panel-veedor-cargando">Cargando detalle…</p>}
                            {detalleCorte.error && <p className="mensaje-error" role="alert">{normalizarErrorApi(detalleCorte.error).detalle}</p>}
                            {detalleCorte.data && (
                              <>
                                <div className="corte-detalle-campo">
                                  <span className="corte-detalle-etiqueta">Inicio</span>
                                  <div className="corte-detalle-valor">
                                    {detalleCorte.data.inicio ? new Date(detalleCorte.data.inicio).toLocaleString('es-CO') : SIN_DATOS}
                                  </div>
                                </div>
                                <div className="corte-detalle-campo">
                                  <span className="corte-detalle-etiqueta">Fin prometido</span>
                                  <div className="corte-detalle-valor">
                                    {detalleCorte.data.finPrometido ? new Date(detalleCorte.data.finPrometido).toLocaleString('es-CO') : SIN_DATOS}
                                  </div>
                                </div>
                                <div className="corte-detalle-campo">
                                  <span className="corte-detalle-etiqueta">Hora real</span>
                                  <div className="corte-detalle-valor">
                                    {detalleCorte.data.finReal ? new Date(detalleCorte.data.finReal).toLocaleString('es-CO') : 'Aún no se restablece'}
                                  </div>
                                </div>
                                <div className="corte-detalle-campo">
                                  <span className="corte-detalle-etiqueta">Origen</span>
                                  <div className="corte-detalle-valor">{detalleCorte.data.origen ?? SIN_DATOS}</div>
                                </div>
                              </>
                            )}

                            {corte.estado === 'RESTABLECIDO' && (
                              <div className="corte-cumplimiento">
                                <Scale size={15} color="#d8b4fe" aria-hidden="true" />
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
                </section>

                <section id="nuevo-corte" className="panel-veedor-seccion-card" aria-labelledby="titulo-crear-corte">
                  <div className="panel-veedor-seccion-header">
                    <div>
                      <div className="panel-veedor-seccion-titulo">
                        <Plus size={18} color="#4ade80" aria-hidden="true" />
                        <h2 id="titulo-crear-corte">Registrar corte</h2>
                      </div>
                      <p className="panel-veedor-seccion-desc">
                        La duración prometida que registres aquí es contra la que se medirá la real.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={crearCorte} className="panel-veedor-form-corte">
                    <div>
                      <div className="panel-veedor-multiselect-cab">
                        <label className="form-reporte-label" htmlFor="filtro-barrios-corte">
                          Barrios afectados ({sectoresNuevos.length} seleccionados)
                        </label>
                        <div className="panel-veedor-buscador">
                          <Search size={14} aria-hidden="true" />
                          <input
                            id="filtro-barrios-corte"
                            type="text"
                            placeholder="Filtrar barrio…"
                            value={busquedaBarrios}
                            onChange={(e) => setBusquedaBarrios(e.target.value)}
                            className="panel-veedor-input panel-veedor-input-buscador"
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
                        {barriosFiltrados.length === 0 && (
                          <p className="panel-veedor-tenue">Ningún barrio coincide con «{busquedaBarrios}».</p>
                        )}
                      </div>
                    </div>

                    <div className="corte-form-grid">
                      <div>
                        <label htmlFor="inicio-corte" className="form-reporte-label">
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
                        <label htmlFor="fin-prometido-corte" className="form-reporte-label">
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
                      <label htmlFor="causa-corte" className="form-reporte-label">
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
                      className="form-suscripcion-boton-enviar panel-veedor-btn-registrar"
                      type="submit"
                      disabled={registrarCorte.isPending || sectoresNuevos.length === 0}
                    >
                      {registrarCorte.isPending ? <><span className="spinner" /> Registrando…</> : 'Registrar corte oficial'}
                    </button>
                  </form>
                </section>
              </>
            )}

            {area === 'ingesta' && (
              <section id="radar-ia" className="panel-veedor-seccion-card" aria-labelledby="titulo-ingesta">
                <div className="panel-veedor-seccion-header">
                  <div>
                    <div className="panel-veedor-seccion-titulo">
                      <Radar size={18} color="#a855f7" aria-hidden="true" />
                      <h2 id="titulo-ingesta">Propuestas de la ingesta automatizada</h2>
                    </div>
                    <p className="panel-veedor-seccion-desc">
                      La ingesta (Acuacar, IoT, prensa) solo propone — el mapa no cambia hasta que un veedor
                      aprueba, comparando el estado propuesto contra la cita textual del documento original.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="bitacora-actualizar-pro panel-veedor-btn-actualizar"
                    aria-label="Actualizar propuestas"
                    onClick={() => void propuestas.refetch()}
                    disabled={propuestas.isFetching}
                  >
                    <RefreshCw size={14} className={propuestas.isFetching ? 'animate-spin' : ''} />
                    Actualizar
                  </button>
                </div>

                {saludIngesta.data && saludIngesta.data.length > 0 && (
                  <div className="panel-veedor-colectores">
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
                  <p className="panel-veedor-cargando" role="status">Cargando propuestas…</p>
                )}

                {!propuestas.isPending && propuestas.data?.items.length === 0 && (
                  <div className="panel-veedor-vacio">
                    <CheckCircle2 size={40} color="#4ade80" aria-hidden="true" />
                    <strong>Cola al día</strong>
                    <p>No hay propuestas pendientes de revisión.</p>
                  </div>
                )}

                {propuestas.data && propuestas.data.totalCount > propuestas.data.items.length && (
                  <p className="mensaje-error panel-veedor-aviso-truncado" role="alert">
                    Mostrando {propuestas.data.items.length} de {propuestas.data.totalCount} propuestas — hay más de las que caben aquí.
                  </p>
                )}

                <div className="lista-moderacion panel-veedor-grid-items">
                  {propuestas.data?.items.map((propuesta) => (
                    <article key={propuesta.id} className="tarjeta-moderacion-item">
                      <div>
                        <div className="moderacion-cab">
                          <span className="moderacion-badge-tipo badge-propuesta">
                            {propuesta.estadoPropuesto.replaceAll('_', ' ')}
                          </span>
                          <span className="estadisticas-badge-status badge-confianza">
                            {Math.round(propuesta.confianza * 100)}% confianza
                          </span>
                        </div>

                        <strong className="moderacion-sector">
                          {nombreDeSector(propuesta.sectorId)} — vía {propuesta.fuente}
                        </strong>
                        <small className="panel-veedor-tenue panel-veedor-tenue-bloque">
                          {new Date(propuesta.detectadaEn).toLocaleString('es-CO')}
                        </small>

                        {/* La cita es el control: sin poder leerla no se puede aprobar con criterio. */}
                        <blockquote className="propuesta-cita">«{propuesta.citaTextual}»</blockquote>
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
            )}
          </>
        )}
      </div>
    </main>
  )
}
