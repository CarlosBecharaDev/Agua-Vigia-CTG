import { memo, useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
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

import { AlertTriangle, CalendarDays, Clock, Download, Scale, BarChart3 } from 'lucide-react'
import { obtenerEstadisticas, obtenerIndiceCumplimientoGlobal, urlExportarCumplimientoCsv, urlExportarEstadisticasCsv } from '../api/services'
import type { EstadisticasGlobales, IndiceCumplimiento } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import './SeccionEstadisticas.css'

const COLORES_BARRAS_PREMIUM = [
  '#ef4444', // Rojo intenso
  '#f97316', // Naranja
  '#f59e0b', // Ámbar
  '#eab308', // Amarillo
  '#10b981', // Esmeralda
  '#3b82f6', // Azul
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
]

/** Lo que se muestra cuando todavía no hay con qué calcular una métrica. Nunca un número: un
 *  dato inventado en el Índice de Cumplimiento destruye la única razón para creerle a la app. */
const SIN_DATOS = 'Sin datos'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SEMANA_CORTOS: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom',
}

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

  // Estados interactivos para las gráficas
  const [modoDias, setModoDias] = useState<'cantidad' | 'porcentaje'>('cantidad')
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [modoBarrios, setModoBarrios] = useState<'cortes' | 'porcentaje'>('cortes')
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string | null>(null)
  const [entradaActiva, setEntradaActiva] = useState(false)
  const seccionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let montado = true
    obtenerEstadisticas()
      .then((res) => { if (montado) { setDatos(res); setErrorApi(null) } })
      .catch((causa) => { if (montado) setErrorApi(normalizarErrorApi(causa).detalle) })
      .finally(() => { if (montado) setCargando(false) })
    obtenerIndiceCumplimientoGlobal()
      .then((res) => { if (montado) setCumplimiento(res) })
      .catch(() => { if (montado) setCumplimiento(null) })
    return () => { montado = false }
  }, [])

  useEffect(() => {
    const seccion = seccionRef.current
    if (!seccion || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setEntradaActiva(true)
      observer.disconnect()
    }, { threshold: 0.08, rootMargin: '80px 0px' })

    observer.observe(seccion)
    return () => observer.disconnect()
  }, [])

  const totalCortes = datos?.sectoresMasAfectados.reduce((acc, s) => acc + s.cantidadCortes, 0) ?? 0
  const sectorTop = datos?.sectoresMasAfectados[0]?.nombre ?? '—'
  const totalCortesAnimado = useCountUpSeguro(totalCortes, entradaActiva && !cargando)

  const totalCortesDias = DIAS_SEMANA.reduce((acc, dia) => acc + (datos?.cortesPorDiaDeSemana[dia] ?? 0), 0) || 1
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

  const totalCortesBarrios = datos?.sectoresMasAfectados.reduce((acc, s) => acc + s.cantidadCortes, 0) || 1
  const datosBarrios = (datos?.sectoresMasAfectados ?? []).map((s, index) => {
    const porcentaje = Number(((s.cantidadCortes / totalCortesBarrios) * 100).toFixed(1))
    return {
      nombre: s.nombre,
      cortes: s.cantidadCortes,
      porcentaje,
      valorMostrado: modoBarrios === 'cortes' ? s.cantidadCortes : porcentaje,
      ranking: index + 1,
    }
  })

  return (
    <section
      id="estadisticas"
      ref={seccionRef}
      className={`estadisticas-seccion${entradaActiva ? ' is-visible' : ''}`}
      aria-label="Estadísticas del servicio de agua en Cartagena"
    >
      {/* Fondo animado de orbes morados */}
      <div className="estadisticas-fondo-animado" aria-hidden="true">
        <div className="orbe-est-1" />
        <div className="orbe-est-2" />
        <div className="orbe-est-3" />
      </div>

      <div className="estadisticas-envoltorio">
        {/* Cabecera Apple Pro */}
        <div className="estadisticas-cab">
          <div>
            <div className="estadisticas-eyebrow-pro">
              <span className="pulse-dot-blue" />
              <span>MÉTRICAS & CUMPLIMIENTO OFICIAL</span>
            </div>
            <h2 className="estadisticas-titulo-pro">Panel de Analítica y Rendimiento</h2>
            <p className="estadisticas-subtitulo-pro">
              Transparencia, duración prometida vs. real e impacto acumulado en las redes de Cartagena.
            </p>
          </div>

          <div className="estadisticas-acciones-cab">
            <span className="estadisticas-badge-status">
              {errorApi ? '● Modo Offline' : '● Red Monitoreada'}
            </span>
            <a
              href={urlExportarEstadisticasCsv()}
              download
              className="estadisticas-btn-exportar"
            >
              <Download size={13} /> Exportar Métricas
            </a>
          </div>
        </div>

        {/* KPIs Bento Glass — 4 Métricas Clave */}
        <div className="estadisticas-kpis-grid">
          {[
            {
              titulo: 'Cumplimiento Global',
              // SIN_DATOS y no '100%': cuando no hay cortes cerrados, la API responde "No hay
              // cortes cerrados todavía" y mostrar un cumplimiento perfecto inventa justo la cifra
              // que esta plataforma existe para contrastar. Es S1 por la regla de datos falsos.
              valor: cumplimiento ? `${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : SIN_DATOS,
              sub: 'Tiempo prometido vs. real',
              Icono: Scale,
              gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            },
            {
              titulo: 'Duración Promedio',
              valor: datos?.duracionPromedioHoras ? `${datos.duracionPromedioHoras} h` : SIN_DATOS,
              sub: 'Por corte cerrado',
              Icono: Clock,
              gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            },
            {
              titulo: 'Total de Incidencias',
              valor: cargando ? '…' : totalCortesAnimado.toLocaleString(),
              sub: 'En sectores con novedades',
              Icono: CalendarDays,
              gradiente: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
            },
            {
              titulo: 'Sector Más Afectado',
              valor: sectorTop,
              sub: 'Mayor cantidad de cortes',
              Icono: AlertTriangle,
              gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            },
          ].map((kpi, i) => {
            const Icono = kpi.Icono
            return (
              <div key={i} className="estadisticas-kpi-card">
                <div
                  className="estadisticas-kpi-icono"
                  style={{ background: kpi.gradiente }}
                >
                  <Icono size={22} />
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

        {/* Índice de Cumplimiento */}
        <section className="estadisticas-card-bloque">
          <div className="estadisticas-card-cab">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Scale size={20} color="#a855f7" aria-hidden="true" />
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
              <Download size={13} /> Exportar CSV
            </a>
          </div>

          <div className="cumplimiento-metricas-grid">
            <div className="cumplimiento-item">
              <span className="cumplimiento-item-tag">Tiempo Prometido</span>
              <span className="cumplimiento-item-val tabular" style={{ color: '#93c5fd' }}>
                {cumplimiento ? `${(cumplimiento.duracionPrometidaSegundos / 3600).toFixed(1)} h` : SIN_DATOS}
              </span>
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
            </div>
            <div className="cumplimiento-item">
              <span className="cumplimiento-item-tag">Tasa de Cumplimiento</span>
              <span className="cumplimiento-item-val tabular" style={{ color: '#4ade80' }}>
                {cumplimiento ? `${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : SIN_DATOS}
              </span>
            </div>
          </div>
        </section>

        {/* Gráficos en Bento Grid Interactivos */}
        <div className="estadisticas-graficos-grid">
          {/* Gráfico 1: Cortes por día */}
          <section className="estadisticas-card-bloque" style={{ marginBottom: 0 }}>
            <div className="estadisticas-card-cab">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <CalendarDays size={18} color="#38bdf8" aria-hidden="true" />
                  <h3>Cortes por Día de la Semana</h3>
                </div>
                <p>Distribución de interrupciones según el día de inicio.</p>
              </div>

              {/* Selector interactivo de visualización */}
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
                    <div key={idx} className="chart-skeleton-bar" style={{ height: `${altura}%`, animationDelay: `${idx * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={datosPorDia}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(e: unknown) => {
                      const payload = (e as { activePayload?: Array<{ payload: { diaCompleto: string } }> })?.activePayload?.[0]?.payload
                      if (payload) {
                        setDiaSeleccionado((prev) => prev === payload.diaCompleto ? null : payload.diaCompleto)
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="gradienteDias" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="gradienteDiasActivo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                    <XAxis dataKey="dia" stroke="#94a3b8" axisLine={false} tickLine={false} dy={8} fontSize={12} fontWeight={600} />
                    <YAxis
                      stroke="#94a3b8"
                      axisLine={false}
                      tickLine={false}
                      dx={-8}
                      fontSize={12}
                      allowDecimals={false}
                      unit={modoDias === 'porcentaje' ? '%' : ''}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.06)', radius: 8 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as { diaCompleto: string; cortes: number; porcentaje: number }
                          const esPico = diaPico && item.diaCompleto === diaPico.diaCompleto
                          return (
                            <div className="custom-tooltip-glass">
                              <div className="custom-tooltip-title">{item.diaCompleto}</div>
                              <div className="custom-tooltip-val" style={{ color: '#38bdf8' }}>
                                {modoDias === 'cantidad' ? `${item.cortes} cortes` : `${item.porcentaje}%`}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'rgba(203, 213, 225, 0.75)', marginTop: '0.2rem' }}>
                                {modoDias === 'cantidad' ? `${item.porcentaje}% del acumulado semanal` : `${item.cortes} incidencias`}
                              </div>
                              {esPico && (
                                <span className="custom-tooltip-tag" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af' }}>
                                  🔥 Día con mayor actividad
                                </span>
                              )}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="valorMostrado"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive={false}
                    >
                      {datosPorDia.map((entry) => {
                        const esSeleccionado = diaSeleccionado === entry.diaCompleto
                        return (
                          <Cell
                            key={entry.dia}
                            fill={esSeleccionado ? 'url(#gradienteDiasActivo)' : 'url(#gradienteDias)'}
                            cursor="pointer"
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {diaSeleccionado && (
              <div className="chart-highlight-pill">
                <span>Foco activo: <strong>{diaSeleccionado}</strong></span>
                <button
                  type="button"
                  onClick={() => setDiaSeleccionado(null)}
                  style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Restablecer
                </button>
              </div>
            )}
          </section>

          {/* Gráfico 2: Sectores más afectados */}
          <section className="estadisticas-card-bloque" style={{ marginBottom: 0 }}>
            <div className="estadisticas-card-cab">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <BarChart3 size={18} color="#f43f5e" aria-hidden="true" />
                  <h3>Sectores Más Afectados</h3>
                </div>
                <p>Cortes cerrados registrados por barrio.</p>
              </div>

              {/* Selector interactivo de unidad */}
              <div className="estadisticas-pill-switch" role="group" aria-label="Modo de visualización por sector">
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
                  % Impacto
                </button>
              </div>
            </div>

            <div className="estadisticas-chart estadisticas-chart--sectores">
              {cargando ? (
                <div className="chart-skeleton-horizontal">
                  {[100, 85, 80, 80, 75].map((w, idx) => (
                    <div key={idx} className="chart-skeleton-hbar" style={{ width: `${w}%`, animationDelay: `${idx * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {datosBarrios.length > 0 ? (
                    <BarChart
                      data={datosBarrios}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 15, bottom: 0 }}
                      barSize={18}
                      onClick={(e: unknown) => {
                        const payload = (e as { activePayload?: Array<{ payload: { nombre: string } }> })?.activePayload?.[0]?.payload
                        if (payload) {
                          setSectorSeleccionado((prev) => prev === payload.nombre ? null : payload.nombre)
                        }
                      }}
                    >
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        dataKey="nombre"
                        type="category"
                        stroke="#cbd5e1"
                        width={130}
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                        fontWeight={650}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as { nombre: string; cortes: number; porcentaje: number; ranking: number }
                            return (
                              <div className="custom-tooltip-glass">
                                <div className="custom-tooltip-title">
                                  #{item.ranking} • {item.nombre}
                                </div>
                                <div className="custom-tooltip-val" style={{ color: '#f43f5e' }}>
                                  {modoBarrios === 'cortes' ? `${item.cortes} cortes` : `${item.porcentaje}%`}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(203, 213, 225, 0.75)', marginTop: '0.2rem' }}>
                                  {modoBarrios === 'cortes' ? `${item.porcentaje}% del total de cortes` : `${item.cortes} incidencias registradas`}
                                </div>
                                <span
                                  className="custom-tooltip-tag"
                                  style={{
                                    background: item.ranking === 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                                    color: item.ranking === 1 ? '#fca5a5' : '#fdba74',
                                  }}
                                >
                                  {item.ranking === 1 ? '⚠️ Sector más crítico' : 'Sector con alta recurrencia'}
                                </span>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar
                        dataKey="valorMostrado"
                        radius={[0, 8, 8, 0]}
                        isAnimationActive={false}
                      >
                        {datosBarrios.map((entry, index) => {
                          const esSeleccionado = sectorSeleccionado === entry.nombre
                          const colorBase = COLORES_BARRAS_PREMIUM[index % COLORES_BARRAS_PREMIUM.length]
                          return (
                            <Cell
                              key={`cell-${entry.nombre}`}
                              fill={esSeleccionado ? '#ffffff' : colorBase}
                              style={{ filter: esSeleccionado ? `drop-shadow(0 0 8px ${colorBase})` : 'none' }}
                              cursor="pointer"
                            />
                          )
                        })}
                      </Bar>
                    </BarChart>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                      {datosBarrios.length === 0 ? 'Sin interrupciones cerradas registradas.' : ''}
                    </div>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            {sectorSeleccionado && (
              <div className="chart-highlight-pill">
                <span>Sector seleccionado: <strong>{sectorSeleccionado}</strong></span>
                <button
                  type="button"
                  onClick={() => setSectorSeleccionado(null)}
                  style={{ background: 'none', border: 'none', color: '#fda4af', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Restablecer
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

/* No recibe props, así que memo la deja fuera de los re-renders de PaginaMapa. Importa porque
   monta las gráficas de Recharts: al colapsar la columna de sectores —un cambio de estado de
   la página que no la toca— se volvían a renderizar enteras, y la animación del panel perdía
   sus primeros cuadros esperando a que terminaran. */
export const SeccionEstadisticas = memo(SeccionEstadisticasBase)
