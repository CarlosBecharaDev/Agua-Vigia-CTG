/**
 * SeccionEstadisticas — M7 (Estadísticas), integrada en la página principal.
 *
 * Vivía en su propia ruta (/estadisticas); ahora es una sección de "/" a la que se llega
 * haciendo scroll (o navegando a "/#estadisticas" desde cualquier otra página — ver
 * PaginaMapa, que escucha el hash y hace scroll hasta acá), igual que la Bitácora.
 *
 * Conectada al backend real: GET /api/estadisticas (M7, público, calculado a partir de
 * cortes oficiales cerrados). El backend expone tres cifras — sectores más afectados,
 * cortes por día de la semana y duración promedio — no una serie diaria ni un histórico
 * comparable mes a mes, así que las gráficas se ajustan a esa forma (nada de tendencias o
 * "insights" inventados sobre datos que el backend no calcula).
 *
 * Glassmorphism en KPIs, animaciones countUp, barras con stagger al scroll — mismo lenguaje
 * visual del resto del rediseño, aplicado a datos reales.
 */
import { useEffect, useRef, useState } from 'react'
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

import { AlertTriangle, CalendarDays, Clock, Scale } from 'lucide-react'
import { obtenerEstadisticas, obtenerIndiceCumplimientoGlobal } from '../api/services'
import type { EstadisticasGlobales, IndiceCumplimiento } from '../api/services'
import { normalizarErrorApi } from '../api/client'

/* ── Paleta premium para las barras del gráfico ── */
const COLORES_BARRAS_PREMIUM = [
  '#ff453a', // Rojo intenso — peor sector
  '#ff6f61', // Coral
  '#ff9f0a', // Ámbar
  '#ffcc00', // Amarillo
  '#30d158', // Verde
  '#2997ff', // Azul acento
  '#5856d6', // Púrpura
  '#af52de', // Magenta
]

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SEMANA_CORTOS: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom',
}

/* ── Hook de animación countUp para los KPIs ── */
function useCountUp(target: number, duracion = 1200, activo = true): number {
  const [valor, setValor] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    if (!activo) return
    const inicio = prevTarget.current === target ? 0 : prevTarget.current
    prevTarget.current = target
    const diff = target - inicio
    if (diff === 0) { setValor(target); return }

    const pasos = 60
    let paso = 0
    const intervalo = setInterval(() => {
      paso++
      if (paso >= pasos) {
        setValor(target)
        clearInterval(intervalo)
      } else {
        const progreso = 1 - Math.pow(1 - paso / pasos, 3)
        setValor(Math.round(inicio + diff * progreso))
      }
    }, duracion / pasos)
    return () => clearInterval(intervalo)
  }, [target, duracion, activo])

  return valor
}

export const SeccionEstadisticas: FC = () => {
  const [datos, setDatos] = useState<EstadisticasGlobales | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Índice de Cumplimiento (M6, RF020-022) — "el diferencial del proyecto": compara la
  // duración prometida de un corte contra la real. Puede no haber datos todavía (400 si no
  // hay ningún corte cerrado) — se trata como "sin datos", no como un error de la sección.
  const [cumplimiento, setCumplimiento] = useState<IndiceCumplimiento | null>(null)

  useEffect(() => {
    let montado = true
    setCargando(true)
    obtenerEstadisticas()
      .then((res) => { if (montado) { setDatos(res); setError(null) } })
      .catch((causa) => { if (montado) setError(normalizarErrorApi(causa).detalle) })
      .finally(() => { if (montado) setCargando(false) })
    obtenerIndiceCumplimientoGlobal()
      .then((res) => { if (montado) setCumplimiento(res) })
      .catch(() => { if (montado) setCumplimiento(null) })
    return () => { montado = false }
  }, [])

  const totalCortes = datos?.sectoresMasAfectados.reduce((acc, s) => acc + s.cantidadCortes, 0) ?? 0
  const sectorTop = datos?.sectoresMasAfectados[0]?.nombre ?? '—'

  // Animación countUp para KPIs visibles
  const [kpisVisibles, setKpisVisibles] = useState(false)
  const kpiSeccionRef = useRef<HTMLDivElement>(null)
  const totalCortesAnimado = useCountUp(totalCortes, 1400, kpisVisibles)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setKpisVisibles(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })

    if (kpiSeccionRef.current) observer.observe(kpiSeccionRef.current)
    return () => observer.disconnect()
  }, [])

  const [barrasVisibles, setBarrasVisibles] = useState(false)
  const seccionBarrasRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setBarrasVisibles(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, rootMargin: '200px' })

    if (seccionBarrasRef.current) observer.observe(seccionBarrasRef.current)
    return () => observer.disconnect()
  }, [])

  const datosBarrios = datos?.sectoresMasAfectados.map((s) => ({ nombre: s.nombre, cortes: s.cantidadCortes })) ?? []
  const datosPorDia = DIAS_SEMANA.map((dia) => ({
    dia: DIAS_SEMANA_CORTOS[dia],
    cortes: datos?.cortesPorDiaDeSemana[dia] ?? 0,
  }))

  /* ── Estilos glassmorphism reutilizables ── */
  const estiloGlass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.6) 0%, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.3) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
  }

  return (
    <section id="estadisticas" aria-label="Estadísticas del servicio de agua en Cartagena" style={{ background: 'var(--color-fondo)' }}>
      {/* Mismo ancho que .bitacora-envoltorio (SeccionBitacora) — para que las dos
          secciones se sientan de la misma medida al bajar por la página, no una más
          angosta que la otra. */}
      <div style={{ padding: '4rem 1.25rem', width: 'min(100% - 2.5rem, 1180px)', margin: '0 auto' }}>

        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            marginBottom: '0.5rem',
            color: 'var(--color-tinta)',
            letterSpacing: '-0.5px',
            fontWeight: '800',
          }}>
            Estadísticas
          </h2>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem' }}>
            Transparencia y seguimiento del servicio de acueducto en Cartagena, calculado a
            partir de los cortes oficiales cerrados.
          </p>
        </div>

        {/* Indicador de fuente de datos */}
        <div
          role="note"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--color-superficie)',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radio-pill)',
            border: '1px solid var(--color-linea)',
            fontSize: '0.75rem',
            marginBottom: '2rem',
          }}
        >
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: error ? 'var(--color-estado-baja)' : 'var(--color-estado-con)',
            display: 'inline-block'
          }}></span>
          {cargando ? 'Cargando estadísticas…' : error ? `Sin conexión — ${error}` : 'Datos en vivo desde el backend'}
        </div>

        {/* ════════════════════════════════════════════════════════════
            KPIs con Glassmorphism + countUp animation (DATOS REALES)
           ════════════════════════════════════════════════════════════ */}
        <div
          ref={kpiSeccionRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ marginBottom: '3.5rem' }}
        >
          {[
            {
              titulo: 'Duración Promedio',
              valor: `${datos?.duracionPromedioHoras ?? 0} h`,
              sub: 'Por corte cerrado',
              Icono: Clock,
              gradiente: 'linear-gradient(135deg, #ff3b30 0%, #ff6f61 100%)',
            },
            {
              titulo: 'Total de Cortes',
              valor: totalCortesAnimado.toLocaleString(),
              sub: 'En sectores con novedades',
              Icono: CalendarDays,
              gradiente: 'linear-gradient(135deg, #0066cc 0%, #2997ff 100%)',
            },
            {
              titulo: 'Sector Más Afectado',
              valor: sectorTop,
              sub: 'Mayor cantidad de cortes',
              Icono: AlertTriangle,
              gradiente: 'linear-gradient(135deg, #ff9500 0%, #ffb340 100%)',
            }
          ].map((kpi, i) => {
            const Icono = kpi.Icono
            return (
              <div
                key={i}
                className="hover-glowing"
                style={{
                  ...estiloGlass,
                  padding: '1.5rem',
                  borderRadius: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  opacity: kpisVisibles ? 1 : 0,
                  transform: kpisVisibles ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s`,
                  cursor: 'default',
                }}
              >
                <div style={{
                  flexShrink: 0,
                  background: kpi.gradiente,
                  padding: '0.85rem',
                  borderRadius: '1rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icono size={22} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'var(--color-tinta-2)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.3rem 0' }}>{kpi.titulo}</h3>
                  <div className="tabular" style={{ color: 'var(--color-tinta)', fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.1', margin: '0', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kpi.valor}</div>
                  <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', margin: '0.3rem 0 0 0' }}>{kpi.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════
            Índice de Cumplimiento (M6, RF020-022) — prometido vs. real. Es la promesa del
            propio hero de la página ("la brecha entre lo prometido y lo real"), así que va
            antes que el resto de gráficas, no escondida al final.
           ════════════════════════════════════════════════════════════ */}
        {cumplimiento && (
          <section style={{
            ...estiloGlass,
            padding: '2rem',
            borderRadius: '2rem',
            marginBottom: '3rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <Scale size={20} color="var(--color-acento)" aria-hidden="true" />
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px' }}>Índice de Cumplimiento</h2>
                <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
                  Duración prometida contra duración real, sobre todos los cortes oficiales cerrados de la ciudad.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
              <div>
                <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>Prometido</div>
                <div className="tabular" style={{ color: 'var(--color-tinta)', fontSize: '1.75rem', fontWeight: '800' }}>{(cumplimiento.duracionPrometidaSegundos / 3600).toFixed(1)} h</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>Real</div>
                <div className="tabular" style={{ color: cumplimiento.desviacionSegundos > 0 ? '#ff453a' : '#30d158', fontSize: '1.75rem', fontWeight: '800' }}>{(cumplimiento.duracionRealSegundos / 3600).toFixed(1)} h</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>Cumplimiento</div>
                <div className="tabular" style={{ color: 'var(--color-tinta)', fontSize: '1.75rem', fontWeight: '800' }}>{cumplimiento.porcentajeCumplimiento.toFixed(0)}%</div>
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════
            Cortes por día de la semana
           ════════════════════════════════════════════════════════════ */}
        <section style={{
          ...estiloGlass,
          padding: '2rem',
          borderRadius: '2rem',
          marginBottom: '3rem',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px' }}>Cortes por Día de la Semana</h2>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
              Distribución de los cortes oficiales cerrados según el día en que iniciaron.
            </p>
          </div>

          <div style={{ height: '280px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="skeleton" style={{ width: '80%', height: '200px', borderRadius: '1rem' }}></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <BarChart data={datosPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-linea)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="dia" stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dy={10} fontSize={11} fontWeight={600} />
                  <YAxis stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dx={-10} fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-superficie)',
                      border: '1px solid var(--color-linea)',
                      borderRadius: '1rem',
                      color: 'var(--color-tinta)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      padding: '0.75rem 1rem',
                    }}
                    itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value} cortes`, 'Cantidad']}
                  />
                  <Bar dataKey="cortes" name="Cortes" fill="#2997ff" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Sectores más afectados (datos reales) — barras con colores premium
           ════════════════════════════════════════════════════════════ */}
        <section ref={seccionBarrasRef} style={{
          ...estiloGlass,
          padding: '2rem',
          borderRadius: '2rem',
          marginBottom: '3rem',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px' }}>
              Sectores Más Afectados
            </h2>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem' }}>
              Cantidad de cortes oficiales cerrados por sector.
            </p>
          </div>

          <div style={{ height: datosBarrios.length > 5 ? '360px' : '280px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton" style={{ height: '24px', borderRadius: '8px', width: `${90 - i * 12}%` }}></div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                {barrasVisibles && datosBarrios.length > 0 ? (
                  <BarChart data={datosBarrios} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} barSize={18} style={{ outline: 'none' }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis dataKey="nombre" type="category" stroke="var(--color-tinta)" width={140} axisLine={false} tickLine={false} fontSize={11} fontWeight={600} />
                    <Tooltip
                      cursor={{ fill: 'var(--color-linea)', opacity: 0.15 }}
                      contentStyle={{
                        backgroundColor: 'var(--color-superficie)',
                        border: '1px solid var(--color-linea)',
                        borderRadius: '1rem',
                        color: 'var(--color-tinta)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        padding: '0.75rem 1rem',
                      }}
                      itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold' }}
                      formatter={(value: number) => [`${value} cortes`, 'Cantidad']}
                    />
                    <Bar dataKey="cortes" radius={[0, 10, 10, 0]} isAnimationActive animationDuration={1200} animationEasing="ease-in-out">
                      {datosBarrios.map((entry, index) => (
                        <Cell key={`cell-${entry.nombre}`} fill={COLORES_BARRAS_PREMIUM[index % COLORES_BARRAS_PREMIUM.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-tinta-3)' }}>
                    {datosBarrios.length === 0 ? 'No hay cortes cerrados registrados todavía.' : ''}
                  </div>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
