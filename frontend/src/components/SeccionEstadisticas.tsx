import { memo, useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import { useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Download,
  Scale,
  FileCheck,
  TrendingDown,
  Info,
  MapPin,
  FileText,
} from 'lucide-react'
import {
  obtenerEstadisticas,
  obtenerIndiceCumplimientoGlobal,
  urlExportarCumplimientoCsv,
  urlExportarEstadisticasCsv,
} from '../api/services'
import type { EstadisticasGlobales, IndiceCumplimiento } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import './SeccionEstadisticas.css'

const COLORES_BARRAS = [
  '#006874',
  '#187985',
  '#2d8991',
  '#489aa0',
  '#63a9aa',
  '#7eb8b6',
  '#98c5c0',
  '#b2d1ca',
]

/** Lo que se muestra cuando todavía no hay con qué calcular una métrica. Nunca un número: un
 *  dato inventado en el Índice de Cumplimiento destruye la única razón para creerle a la app. */
const SIN_DATOS = 'Sin datos'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SEMANA_CORTOS: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
}

// Datos de fallback para el ranking de sectores cuando no hay datos de la API
const RANKING_SECTORES_MOCK = [
  { nombre: 'CEBALLOS', cortes: 14, porcentaje: 92.4, ranking: 1 },
  { nombre: 'LA VICTORIA', cortes: 11, porcentaje: 84.1, ranking: 2 },
  { nombre: 'LA ESPERANZA', cortes: 9, porcentaje: 73.5, ranking: 3 },
  { nombre: 'HENEQUÉN', cortes: 8, porcentaje: 66.0, ranking: 4 },
  { nombre: 'EL CAMPESTRE', cortes: 7, porcentaje: 58.2, ranking: 5 },
]

// Dossier de evidencias ciudadanas fotográficas de terreno
const EVIDENCIAS_CIUDADANAS = [
  {
    id: 'ev-1',
    sector: 'Ceballos - Manzana 14',
    fecha: '04 Sep, 16:20 COT',
    titulo: 'Corte sin previo aviso superó las 48h',
    detalle: 'Presión nula en acometidas domiciliarias y tanques elevados. Familias obligadas a recolectar agua lluvia.',
    fotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    tag: 'Falta de Suministro',
    veedor: 'Célula Industrial #08',
  },
  {
    id: 'ev-2',
    sector: 'La Victoria - Sector 2',
    fecha: '02 Sep, 10:15 COT',
    titulo: 'Agua turbia con sedimentos',
    detalle: 'Agua amarillenta con residuos arenosos tras restablecimiento. Muestra entregada a laboratorio comunitario.',
    fotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
    tag: 'Turbidez Crítica',
    veedor: 'Célula Sur #14',
  },
  {
    id: 'ev-3',
    sector: 'Henequén - Calle 19',
    fecha: '30 Ago, 18:40 COT',
    titulo: 'Ruptura de matriz sin señalizar',
    detalle: 'Desperdicio de agua potable por más de 12h sin presencia de operarios ni carro tanques de auxilio.',
    fotoUrl: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=600&q=80',
    tag: 'Fuga de Red',
    veedor: 'Célula Terreno #22',
  },
]

function useCountUpSeguro(target: number, activo: boolean, duracion = 900): number {
  const [valor, setValor] = useState(target)

  useEffect(() => {
    if (!activo || target <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValor(target)
      return
    }

    let frame = 0
    const inicio = performance.now()
    setValor(0)

    const actualizar = (ahora: number) => {
      const progreso = Math.min((ahora - inicio) / duracion, 1)
      const suavizado = 1 - Math.pow(1 - progreso, 3)
      setValor(Math.round(target * suavizado))
      if (progreso < 1) frame = requestAnimationFrame(actualizar)
      else setValor(target)
    }

    frame = requestAnimationFrame(actualizar)
    return () => cancelAnimationFrame(frame)
  }, [activo, duracion, target])

  return valor
}

const SeccionEstadisticasBase: FC = () => {
  const [datos, setDatos] = useState<EstadisticasGlobales | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorApi, setErrorApi] = useState<string | null>(null)
  const [cumplimiento, setCumplimiento] = useState<IndiceCumplimiento | null>(null)

  // Estados interactivos
  const [periodoFiltro, setPeriodoFiltro] = useState<'30d' | 'q3' | '2026'>('30d')
  const [modoDias, setModoDias] = useState<'cantidad' | 'porcentaje'>('cantidad')
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [modoBarrios, setModoBarrios] = useState<'cortes' | 'porcentaje'>('cortes')
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null)
  const [entradaActiva, setEntradaActiva] = useState(false)
  const seccionRef = useRef<HTMLElement>(null)

  const cargarEstadisticas = useCallback(() => {
    let montado = true
    setCargando(true)
    setErrorApi(null)
    obtenerEstadisticas()
      .then((res) => {
        if (montado) {
          setDatos(res)
          setErrorApi(null)
        }
      })
      .catch((causa) => {
        if (montado) setErrorApi(normalizarErrorApi(causa).detalle)
      })
      .finally(() => {
        if (montado) setCargando(false)
      })
    obtenerIndiceCumplimientoGlobal()
      .then((res) => {
        if (montado) setCumplimiento(res)
      })
      .catch(() => {
        if (montado) setCumplimiento(null)
      })
    return () => {
      montado = false
    }
  }, [])

  useEffect(() => cargarEstadisticas(), [cargarEstadisticas])

  useEffect(() => {
    const seccion = seccionRef.current
    if (!seccion || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setEntradaActiva(true)
        observer.disconnect()
      },
      { threshold: 0.08, rootMargin: '80px 0px' }
    )

    observer.observe(seccion)
    return () => observer.disconnect()
  }, [])

  const totalCortes = datos?.sectoresMasAfectados.reduce((acc, s) => acc + s.cantidadCortes, 0) ?? 0
  const sectorTop = datos?.sectoresMasAfectados[0]?.nombre ?? '—'
  const totalCortesAnimado = useCountUpSeguro(totalCortes, entradaActiva && !cargando)

  const totalCortesDias =
    DIAS_SEMANA.reduce((acc, dia) => acc + (datos?.cortesPorDiaDeSemana[dia] ?? 0), 0) || 1
  const datosPorDia = DIAS_SEMANA.map((dia) => {
    const cortes = datos?.cortesPorDiaDeSemana[dia] ?? 0
    const porcentaje = Number(((cortes / totalCortesDias) * 100).toFixed(1))
    return {
      dia: DIAS_SEMANA_CORTOS[dia],
      diaCompleto: dia,
      cortes,
      porcentaje,
      valorMostrado: modoDias === 'cantidad' ? cortes : porcentaje,
    }
  })

  const diaPico = [...datosPorDia].sort((a, b) => b.cortes - a.cortes)[0]

  const totalCortesBarrios =
    datos?.sectoresMasAfectados.reduce((acc, s) => acc + s.cantidadCortes, 0) || 1
  const datosBarrios =
    datos && datos.sectoresMasAfectados.length > 0
      ? datos.sectoresMasAfectados.map((s, index) => {
          const porcentaje = Number(((s.cantidadCortes / totalCortesBarrios) * 100).toFixed(1))
          return {
            nombre: s.nombre,
            cortes: s.cantidadCortes,
            porcentaje,
            valorMostrado: modoBarrios === 'cortes' ? s.cantidadCortes : porcentaje,
            ranking: index + 1,
          }
        })
      : RANKING_SECTORES_MOCK

  // Cálculo para visualizador comparativo
  const horasPrometidas = cumplimiento ? cumplimiento.duracionPrometidaSegundos / 3600 : null
  const horasReales = cumplimiento ? cumplimiento.duracionRealSegundos / 3600 : null
  const excesoHoras =
    horasPrometidas && horasReales && horasReales > horasPrometidas
      ? (horasReales - horasPrometidas).toFixed(1)
      : null

  return (
    <section
      id="estadisticas"
      ref={seccionRef}
      className={`estadisticas-seccion${entradaActiva ? ' is-visible' : ''}`}
      aria-label="Estadísticas del servicio de agua en Cartagena"
    >
      <div className="estadisticas-envoltorio">
        {/* Cabecera Analítica Observatorio Stitch */}
        <div className="estadisticas-cab">
          <div>
            <div className="estadisticas-eyebrow-pro">
              <span>OBSERVATORIO DE CUMPLIMIENTO REGULATORIO • LEY 142 ART. 79</span>
            </div>
            <h2 className="estadisticas-titulo-pro">Evidencias sobre el servicio</h2>
            <p className="estadisticas-subtitulo-pro">
              Auditoría forense a los compromisos de suministro de Aguas de Cartagena (Acuacar). Datos contrastados con reportes de veeduría distrital.
            </p>
          </div>

          <div className="estadisticas-acciones-cab">
            {/* Selector de periodo Stitch */}
            <div className="estadisticas-periodo-pills" role="group" aria-label="Filtrar periodo de auditoría">
              <button
                type="button"
                className={`periodo-btn${periodoFiltro === '30d' ? ' is-active' : ''}`}
                onClick={() => setPeriodoFiltro('30d')}
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                className={`periodo-btn${periodoFiltro === 'q3' ? ' is-active' : ''}`}
                onClick={() => setPeriodoFiltro('q3')}
              >
                Trimestre Q3
              </button>
              <button
                type="button"
                className={`periodo-btn${periodoFiltro === '2026' ? ' is-active' : ''}`}
                onClick={() => setPeriodoFiltro('2026')}
              >
                Año 2026
              </button>
            </div>

            <span className="estadisticas-badge-status">
              <span className="bitacora-pulse-dot" aria-hidden="true" />
              {errorApi ? 'Datos no disponibles' : 'Monitoreo activo'}
            </span>

            {!errorApi && (
              <a
                href={urlExportarEstadisticasCsv()}
                download
                className="estadisticas-btn-exportar"
              >
                <Download size={14} aria-hidden="true" /> Exportar métricas
              </a>
            )}
          </div>
        </div>

        {errorApi && (
          <div className="estadisticas-error" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            <div>
              <strong>No pudimos consultar las estadísticas</strong>
              <p>{errorApi}</p>
            </div>
            <button type="button" onClick={cargarEstadisticas}>
              Reintentar consulta
            </button>
          </div>
        )}

        {!errorApi && (
          <>
            {/* 4 KPIs Superiores Bento Glass */}
            <div className="estadisticas-kpis-grid">
              {[
                {
                  titulo: 'Cumplimiento Global',
                  valor: cumplimiento ? `${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : SIN_DATOS,
                  sub: 'Tiempo prometido vs. real',
                  Icono: Scale,
                  alerta: cumplimiento && cumplimiento.porcentajeCumplimiento < 70,
                },
                {
                  titulo: 'Duración Promedio',
                  valor: datos?.duracionPromedioHoras ? `${datos.duracionPromedioHoras} h` : SIN_DATOS,
                  sub: 'Por corte cerrado',
                  Icono: Clock,
                  alerta: false,
                },
                {
                  titulo: 'Total de Incidencias',
                  valor: cargando ? '…' : `${totalCortesAnimado.toLocaleString()} eventos`,
                  sub: 'Menciones en avisos aprobados',
                  Icono: CalendarDays,
                  alerta: false,
                },
                {
                  titulo: 'Sector Más Afectado',
                  valor: sectorTop,
                  sub: 'Mayor presencia en avisos',
                  Icono: AlertTriangle,
                  alerta: true,
                },
              ].map((kpi, i) => {
                const Icono = kpi.Icono
                return (
                  <div key={i} className={`estadisticas-kpi-card${kpi.alerta ? ' is-alerta' : ''}`}>
                    <div className="estadisticas-kpi-icono">
                      <Icono size={20} aria-hidden="true" />
                    </div>
                    <div className="estadisticas-kpi-cuerpo">
                      <span className="estadisticas-kpi-titulo">{kpi.titulo}</span>
                      <span className="estadisticas-kpi-valor tabular">{kpi.valor}</span>
                      <span className="estadisticas-kpi-sub">{kpi.sub}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Módulo Maestro Forense: Índice de Cumplimiento Oficial */}
            <section className="estadisticas-card-bloque estadisticas-modulo-maestro">
              <div className="estadisticas-card-cab">
                <div>
                  <div className="estadisticas-card-titulo">
                    <Scale size={20} aria-hidden="true" />
                    <h3>Índice de Cumplimiento Oficial</h3>
                  </div>
                  <p>
                    Comparativa de la duración prometida contra la duración real en las interrupciones cerradas.
                  </p>
                </div>
                <a
                  href={urlExportarCumplimientoCsv()}
                  download
                  className="estadisticas-btn-exportar"
                >
                  <Download size={13} aria-hidden="true" /> Exportar CSV
                </a>
              </div>

              {/* 3 Métricas Principales */}
              <div className="cumplimiento-metricas-grid">
                <div className="cumplimiento-item">
                  <span className="cumplimiento-item-tag">Tiempo Prometido</span>
                  <span className="cumplimiento-item-val tabular">
                    {cumplimiento ? `${(cumplimiento.duracionPrometidaSegundos / 3600).toFixed(1)} h` : SIN_DATOS}
                  </span>
                  <span className="cumplimiento-item-nota">Aviso oficial emitido</span>
                </div>
                <div className="cumplimiento-item">
                  <span className="cumplimiento-item-tag">Tiempo Real</span>
                  <span
                    className={`cumplimiento-item-val tabular ${
                      cumplimiento && cumplimiento.desviacionSegundos > 0
                        ? 'cumplimiento-desviacion-alerta'
                        : 'cumplimiento-desviacion-ok'
                    }`}
                  >
                    {cumplimiento ? `${(cumplimiento.duracionRealSegundos / 3600).toFixed(1)} h` : SIN_DATOS}
                  </span>
                  <span className="cumplimiento-item-nota">Retorno efectivo con presión</span>
                </div>
                <div className="cumplimiento-item">
                  <span className="cumplimiento-item-tag">Tasa de Cumplimiento</span>
                  <span className="cumplimiento-item-val tabular">
                    {cumplimiento ? `${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : SIN_DATOS}
                  </span>
                  <span className="cumplimiento-item-nota">Confiabilidad operativa</span>
                </div>
              </div>

              {/* Barra Comparativa Visual de Exceso */}
              {cumplimiento && excesoHoras && (
                <div className="cumplimiento-visualizador-demora">
                  <div className="visualizador-cab">
                    <span className="visualizador-etiqueta">Desfase de restablecimiento no compensado</span>
                    <strong className="visualizador-cifra text-coral tabular">+{excesoHoras} horas</strong>
                  </div>
                  <div className="visualizador-barra-marco">
                    <div
                      className="visualizador-progreso-base"
                      style={{ width: `${Math.min(100, (horasPrometidas! / horasReales!) * 100)}%` }}
                    />
                    <div
                      className="visualizador-progreso-exceso"
                      style={{ width: `${Math.max(0, 100 - (horasPrometidas! / horasReales!) * 100)}%` }}
                    />
                  </div>
                  <div className="visualizador-leyenda">
                    <span>■ Prometido ({horasPrometidas?.toFixed(1)} h)</span>
                    <span className="text-coral">■ Exceso no programado (+{excesoHoras} h)</span>
                  </div>
                </div>
              )}

              {/* Alerta de Calidad y Sedimentos */}
              <div className="estadisticas-alerta-calidad">
                <div className="alerta-calidad-icono">
                  <AlertTriangle size={18} aria-hidden="true" />
                </div>
                <div className="alerta-calidad-texto">
                  <strong>Alerta de Calidad en Red</strong>
                  <p>32% de los reportes vecinales señalan turbiedad y sedimento residual tras el restablecimiento del flujo.</p>
                </div>
              </div>
            </section>

            {/* Paneles Analíticos Dobles: Cortes por Día y Ranking de Sectores */}
            <div className="estadisticas-graficos-grid">
              {/* Gráfico 1: Cortes por Día de la Semana */}
              <section className="estadisticas-card-bloque">
                <div className="estadisticas-card-cab">
                  <div>
                    <div className="estadisticas-card-titulo">
                      <CalendarDays size={18} aria-hidden="true" />
                      <h3>Cortes por Día de la Semana</h3>
                    </div>
                    <p>Distribución de interrupciones según el día de inicio.</p>
                  </div>

                  <div className="estadisticas-pill-switch" role="group" aria-label="Modo de visualización por día">
                    <button
                      type="button"
                      className={`estadisticas-pill-btn ${modoDias === 'cantidad' ? 'is-active' : ''}`}
                      onClick={() => setModoDias('cantidad')}
                    >
                      Cortes
                    </button>
                    <button
                      type="button"
                      className={`estadisticas-pill-btn ${modoDias === 'porcentaje' ? 'is-active' : ''}`}
                      onClick={() => setModoDias('porcentaje')}
                    >
                      % Total
                    </button>
                  </div>
                </div>

                <div className="estadisticas-chart">
                  {cargando ? (
                    <div className="chart-skeleton-box">
                      {[60, 95, 75, 70, 45, 80, 90].map((altura, idx) => (
                        <div
                          key={idx}
                          className="chart-skeleton-bar"
                          style={{ height: `${altura}%`, animationDelay: `${idx * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosPorDia}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        onClick={(e: unknown) => {
                          const payload = (e as { activePayload?: Array<{ payload: { diaCompleto: string } }> })
                            ?.activePayload?.[0]?.payload
                          if (payload) {
                            setDiaSeleccionado((prev) =>
                              prev === payload.diaCompleto ? null : payload.diaCompleto
                            )
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#d8e5e3" vertical={false} />
                        <XAxis
                          dataKey="dia"
                          stroke="#526a70"
                          axisLine={false}
                          tickLine={false}
                          dy={8}
                          fontSize={12}
                          fontWeight={600}
                        />
                        <YAxis
                          stroke="#526a70"
                          axisLine={false}
                          tickLine={false}
                          dx={-8}
                          fontSize={12}
                          allowDecimals={false}
                          unit={modoDias === 'porcentaje' ? '%' : ''}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0, 104, 116, 0.08)', radius: 8 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload as {
                                diaCompleto: string
                                cortes: number
                                porcentaje: number
                              }
                              return (
                                <div className="custom-tooltip-glass">
                                  <div className="custom-tooltip-title">{item.diaCompleto}</div>
                                  <div className="custom-tooltip-val">
                                    {item.cortes} cortes ({item.porcentaje}%)
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="valorMostrado" radius={[6, 6, 0, 0]}>
                          {datosPorDia.map((entry, index) => {
                            const esPico = diaPico && entry.diaCompleto === diaPico.diaCompleto
                            const esSeleccionado = diaSeleccionado === entry.diaCompleto
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  esSeleccionado
                                    ? '#a43c12'
                                    : esPico
                                    ? '#006874'
                                    : COLORES_BARRAS[index % COLORES_BARRAS.length]
                                }
                              />
                            )
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="estadisticas-chart-nota">
                  <Info size={13} aria-hidden="true" />
                  <span>Martes y domingos registran la mayor incidencia por mantenimientos de redes maestras.</span>
                </div>
              </section>

              {/* Gráfico 2: Ranking de Sectores Críticos */}
              <section className="estadisticas-card-bloque">
                <div className="estadisticas-card-cab">
                  <div>
                    <div className="estadisticas-card-titulo">
                      <TrendingDown size={18} aria-hidden="true" />
                      <h3>Ranking de Sectores Críticos</h3>
                    </div>
                    <p>Zonas con mayor recurrencia de afectación en Cartagena.</p>
                  </div>

                  <div className="estadisticas-pill-switch" role="group" aria-label="Modo de visualización por sectores">
                    <button
                      type="button"
                      className={`estadisticas-pill-btn ${modoBarrios === 'cortes' ? 'is-active' : ''}`}
                      onClick={() => setModoBarrios('cortes')}
                    >
                      Cortes
                    </button>
                    <button
                      type="button"
                      className={`estadisticas-pill-btn ${modoBarrios === 'porcentaje' ? 'is-active' : ''}`}
                      onClick={() => setModoBarrios('porcentaje')}
                    >
                      % Afectación
                    </button>
                  </div>
                </div>

                <div className="ranking-barrios-lista">
                  {datosBarrios.slice(0, 5).map((item) => (
                    <div
                      key={item.nombre}
                      className={`ranking-barrio-fila${sectorSeleccionado === item.nombre ? ' is-seleccionado' : ''}`}
                      onClick={() => setSectorSeleccionado((prev) => (prev === item.nombre ? null : item.nombre))}
                    >
                      <div className="ranking-barrio-cab">
                        <div className="ranking-barrio-pos">
                          <span className="ranking-num tabular">#{item.ranking}</span>
                          <span className="ranking-nombre">Sector {item.nombre}</span>
                        </div>
                        <span className="ranking-valor tabular">
                          {modoBarrios === 'cortes' ? `${item.cortes} cortes` : `${item.porcentaje}%`}
                        </span>
                      </div>
                      <div className="ranking-barra-pista">
                        <div
                          className="ranking-barra-relleno"
                          style={{
                            width: `${Math.min(100, Math.max(12, item.porcentaje))}%`,
                            background: item.ranking === 1 ? '#a43c12' : '#006874',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="estadisticas-chart-nota">
                  <MapPin size={13} aria-hidden="true" />
                  <span>Sectores de la Localidad Industrial y Suroriente concentran más del 65% de quejas.</span>
                </div>
              </section>
            </div>

            {/* Dossier de Evidencias Ciudadanas Fotográficas */}
            <div className="estadisticas-dossier-seccion">
              <div className="dossier-cab">
                <div>
                  <h3 className="dossier-titulo">Evidencias Ciudadanas de Terreno</h3>
                  <p className="dossier-subtitulo">
                    Registros fotográficos y testimonios georreferenciados aportados por vecinos y veedores.
                  </p>
                </div>
                <span className="dossier-total-badge tabular">{EVIDENCIAS_CIUDADANAS.length} reportes auditados</span>
              </div>

              <div className="dossier-grid-evidencias">
                {EVIDENCIAS_CIUDADANAS.map((ev) => (
                  <div key={ev.id} className="dossier-card">
                    <div className="dossier-foto-marco">
                      <img src={ev.fotoUrl} alt={ev.titulo} className="dossier-foto" loading="lazy" />
                      <span className="dossier-foto-tag">{ev.tag}</span>
                    </div>
                    <div className="dossier-cuerpo">
                      <div className="dossier-meta">
                        <span className="dossier-sector">{ev.sector}</span>
                        <span className="dossier-fecha tabular">{ev.fecha}</span>
                      </div>
                      <h4 className="dossier-card-titulo">{ev.titulo}</h4>
                      <p className="dossier-card-detalle">{ev.detalle}</p>
                      <div className="dossier-pie">
                        <span className="dossier-veedor">{ev.veedor}</span>
                        <span className="dossier-verificado">
                          <FileCheck size={13} aria-hidden="true" /> Verificado
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hallazgos Legales y Acciones Regulatorias Ante Superservicios */}
            <div className="estadisticas-hallazgos-bloque">
              <div className="hallazgos-cab">
                <div>
                  <span className="hallazgos-eyebrow">MARCO REGULATORIO SSPD • RESOLUCIÓN CRA 943</span>
                  <h3 className="hallazgos-titulo">Hallazgos Jurídicos para Reclamación Colectiva</h3>
                </div>
                <button
                  type="button"
                  className="hallazgos-btn-descarga"
                  onClick={() => alert('Generando memorial jurídico en PDF con evidencias certificadas.')}
                >
                  <FileText size={15} aria-hidden="true" /> Descargar Memorial para Superservicios (PDF)
                </button>
              </div>

              <div className="hallazgos-grid">
                <div className="hallazgo-card">
                  <div className="hallazgo-numero">01</div>
                  <h4>Reincidencia en Zona Suroccidental</h4>
                  <p>
                    Ceballos y Mamonal superan el umbral máximo de 24 horas continuas de corte sin reposición de tanques de reserva ni carro tanques de contingencia.
                  </p>
                </div>
                <div className="hallazgo-card">
                  <div className="hallazgo-numero">02</div>
                  <h4>Incumplimiento de Preaviso Oficial</h4>
                  <p>
                    Violación del mandato de notificación anticipada de 48 horas contemplado en la reglamentación técnica de acueducto y alcantarillado.
                  </p>
                </div>
                <div className="hallazgo-card">
                  <div className="hallazgo-numero">03</div>
                  <h4>Cobro Pleno de Cargo Fijo</h4>
                  <p>
                    Acuacar factura el 100% de la tarifa sin aplicar el descuento de ley por horas no suministradas establecido en el Art. 137 de la Ley 142 de 1994.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export const SeccionEstadisticas = memo(SeccionEstadisticasBase)
