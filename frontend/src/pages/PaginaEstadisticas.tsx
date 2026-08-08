/**
 * PaginaEstadisticas — M7 (Estadísticas).
 *
 * Conectada a datos REALES de Acuacar (WordPress API) y clima (Open-Meteo).
 * Deriva todas las métricas a partir de los boletines oficiales:
 *  - KPIs: total boletines, barrios afectados, frecuencia promedio
 *  - Gráfico de área: actividad de boletines por día
 *  - Barras: barrios más mencionados en boletines
 *
 * Misión Visual (Sprint 5): Glassmorphism en KPIs, animaciones countUp,
 * barras con stagger al scroll, paleta premium con gradientes.
 */
import { useState, useEffect, useRef } from 'react'
import type { FC } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts'

import { Download, AlertTriangle, Clock, Sparkles, Activity, Newspaper } from 'lucide-react'
import { obtenerBoletinesRecientes } from '../api/acuacar'
import type { BoletinAcuacar } from '../api/acuacar'

// ──────────────────────────────────────────────────────────────
// Funciones de análisis de datos reales
// ──────────────────────────────────────────────────────────────

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Agrupa boletines por día y cuenta cuántos se publicaron cada día */
function agruparBoletinesPorDia(
  boletines: BoletinAcuacar[],
  periodo: '30dias' | '3meses'
): { fecha: string; boletines: number; barrios: number }[] {
  const hoy = new Date();
  const inicio = new Date(hoy);

  if (periodo === '30dias') {
    inicio.setDate(hoy.getDate() - 29);
  } else {
    inicio.setMonth(hoy.getMonth() - 3);
  }

  // Crear mapa de días con datos
  const mapaDias = new Map<string, { boletines: number; barrios: Set<string> }>();

  // Rellenar todos los días del rango (para que el gráfico no tenga huecos)
  const cursor = new Date(inicio);
  while (cursor <= hoy) {
    const clave = cursor.toISOString().split('T')[0];
    mapaDias.set(clave, { boletines: 0, barrios: new Set() });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Contar boletines por día
  for (const b of boletines) {
    const fechaBoletin = new Date(b.fecha);
    if (fechaBoletin < inicio) continue;
    const clave = fechaBoletin.toISOString().split('T')[0];
    const dia = mapaDias.get(clave);
    if (dia) {
      dia.boletines += 1;
      b.barriosAfectados.forEach(barrio => dia.barrios.add(barrio));
    }
  }

  // Convertir a array para Recharts
  return Array.from(mapaDias.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, datos]) => {
      const d = new Date(clave + 'T12:00:00');
      return {
        fecha: `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`,
        boletines: datos.boletines,
        barrios: datos.barrios.size,
      };
    });
}

/** Cuenta cuántas veces aparece cada barrio en los boletines en un periodo de tiempo */
function contarBarriosMasAfectados(
  boletines: BoletinAcuacar[],
  periodo: '30dias' | '3meses'
): { nombre: string; menciones: number }[] {
  const conteo = new Map<string, number>();
  
  const hoy = new Date();
  const inicio = new Date(hoy);
  if (periodo === '30dias') {
    inicio.setDate(hoy.getDate() - 29);
  } else {
    inicio.setMonth(hoy.getMonth() - 3);
  }

  for (const b of boletines) {
    const fechaBoletin = new Date(b.fecha);
    if (fechaBoletin < inicio) continue; // Filtramos si está fuera del periodo
    
    for (const barrio of b.barriosAfectados) {
      conteo.set(barrio, (conteo.get(barrio) || 0) + 1);
    }
  }

  return Array.from(conteo.entries())
    .map(([nombre, menciones]) => ({ nombre, menciones }))
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 8);
}

/** Calcula la frecuencia promedio entre boletines (en días) */
function calcularFrecuenciaPromedio(boletines: BoletinAcuacar[]): string {
  if (boletines.length < 2) return '—';
  const fechas = boletines.map(b => new Date(b.fecha).getTime()).sort((a, b) => a - b);
  let sumaIntervalos = 0;
  for (let i = 1; i < fechas.length; i++) {
    sumaIntervalos += (fechas[i] - fechas[i - 1]);
  }
  const promedioDias = sumaIntervalos / (fechas.length - 1) / (1000 * 60 * 60 * 24);
  return promedioDias < 1
    ? `${Math.round(promedioDias * 24)} hrs`
    : `${promedioDias.toFixed(1)} días`;
}

/** Genera un insight textual basado en datos reales del periodo seleccionado */
function generarInsight(
  boletines: BoletinAcuacar[], 
  barriosTop: { nombre: string; menciones: number }[],
  periodo: '30dias' | '3meses'
): string {
  const hoy = new Date();
  const inicioActual = new Date(hoy);
  const inicioAnterior = new Date(hoy);
  
  if (periodo === '30dias') {
    inicioActual.setDate(hoy.getDate() - 29);
    inicioAnterior.setDate(hoy.getDate() - 59); // para comparar con los 30 días anteriores
  } else {
    inicioActual.setMonth(hoy.getMonth() - 3);
    inicioAnterior.setMonth(hoy.getMonth() - 6);
  }

  const boletinesActuales = boletines.filter(b => new Date(b.fecha) >= inicioActual);
  const boletinesAnteriores = boletines.filter(b => {
    const f = new Date(b.fecha);
    return f >= inicioAnterior && f < inicioActual;
  });

  const total = boletinesActuales.length;
  const totalAnt = boletinesAnteriores.length;
  const tendencia = totalAnt > 0 ? Math.round(((total - totalAnt) / totalAnt) * 100) : 0;
  
  const barriosUnicos = new Set<string>();
  boletinesActuales.forEach(b => b.barriosAfectados.forEach(barrio => barriosUnicos.add(barrio)));

  if (total === 0) {
    return `¡Excelentes noticias! No se registraron interrupciones oficiales en ${periodo === '30dias' ? 'los últimos 30 días' : 'los últimos 3 meses'}.`;
  }

  const partes: string[] = [];
  partes.push(`Según las gráficas, en ${periodo === '30dias' ? 'los últimos 30 días' : 'los últimos 3 meses'}, Acuacar emitió <strong>${total} boletines</strong> oficiales que afectaron a <strong>${barriosUnicos.size} barrios</strong> distintos.`);

  if (tendencia > 0) {
    partes.push(`Esto representa un preocupante <strong>aumento del ${tendencia}%</strong> en comparación con el periodo inmediatamente anterior.`);
  } else if (tendencia < 0) {
    partes.push(`Afortunadamente, esto muestra una <strong>disminución del ${Math.abs(tendencia)}%</strong> en comparación con el periodo anterior.`);
  } else {
    partes.push(`La frecuencia de problemas reportados se ha mantenido constante respecto al periodo anterior.`);
  }

  if (barriosTop.length > 0) {
    const peor = barriosTop[0];
    partes.push(`El gráfico de barras revela que <strong>${peor.nombre}</strong> fue la zona más castigada, liderando con ${peor.menciones} menciones.`);
    if (barriosTop.length > 2) {
      partes.push(`Le siguen de cerca ${barriosTop[1].nombre} y ${barriosTop[2].nombre}.`);
    }
  }

  return partes.join(' ');
}

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
        // ease-out cubic
        const progreso = 1 - Math.pow(1 - paso / pasos, 3)
        setValor(Math.round(inicio + diff * progreso))
      }
    }, duracion / pasos)
    return () => clearInterval(intervalo)
  }, [target, duracion, activo])

  return valor
}

const PaginaEstadisticas: FC = () => {
  const [periodo, setPeriodo] = useState<'30dias' | '3meses'>('3meses')
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([])
  const [cargando, setCargando] = useState(true)
  const [usandoDatosReales, setUsandoDatosReales] = useState(false)

  // Datos derivados de los boletines reales
  const [datosTimeline, setDatosTimeline] = useState<{ fecha: string; boletines: number; barrios: number }[]>([])
  const [datosBarrios, setDatosBarrios] = useState<{ nombre: string; menciones: number }[]>([])
  const [kpiTotal, setKpiTotal] = useState(0)
  const [kpiFrecuencia, setKpiFrecuencia] = useState('—')
  const [kpiBarriosAfectados, setKpiBarriosAfectados] = useState(0)
  const [textoInsight, setTextoInsight] = useState('')

  // Animación countUp para KPIs visibles
  const [kpisVisibles, setKpisVisibles] = useState(false)
  const kpiSeccionRef = useRef<HTMLDivElement>(null)
  const totalAnimado = useCountUp(kpiTotal, 1400, kpisVisibles)
  const barriosAnimado = useCountUp(kpiBarriosAfectados, 1400, kpisVisibles)

  // Observer para animar KPIs al entrar en viewport
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setKpisVisibles(true)
        observer.disconnect()
      }
    }, { threshold: 0.2 })
    
    if (kpiSeccionRef.current) {
      observer.observe(kpiSeccionRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // ─── Cargar boletines reales de Acuacar ───
  useEffect(() => {
    setCargando(true)
    // Pedimos los últimos 100 boletines para tener buen rango de datos
    obtenerBoletinesRecientes(100)
      .then(data => {
        if (data && data.length > 0) {
          setBoletines(data)
          setUsandoDatosReales(true)
        } else {
          setUsandoDatosReales(false)
        }
      })
      .catch(() => {
        setUsandoDatosReales(false)
      })
      .finally(() => setCargando(false))
  }, [])

  // ─── Recalcular métricas cuando cambian boletines o periodo ───
  useEffect(() => {
    if (boletines.length === 0) return

    // Timeline de actividad
    const timeline = agruparBoletinesPorDia(boletines, periodo)
    setDatosTimeline(timeline)

    // Barrios más mencionados
    const barriosTop = contarBarriosMasAfectados(boletines, periodo)
    setDatosBarrios(barriosTop)

    // KPIs
    setKpiTotal(boletines.length)
    setKpiFrecuencia(calcularFrecuenciaPromedio(boletines))
    const barriosUnicos = new Set<string>()
    boletines.forEach(b => b.barriosAfectados.forEach(barrio => barriosUnicos.add(barrio)))
    setKpiBarriosAfectados(barriosUnicos.size)

    // Insight
    setTextoInsight(generarInsight(boletines, barriosTop, periodo))
  }, [boletines, periodo])

  const [barrasVisibles, setBarrasVisibles] = useState(false)
  const seccionBarrasRef = useRef<HTMLElement>(null)

  // Disparar animación de barras al hacer scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setBarrasVisibles(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, rootMargin: '200px' })
    
    if (seccionBarrasRef.current) {
      observer.observe(seccionBarrasRef.current)
    }
    return () => observer.disconnect()
  }, [])

  /* ── Estilos glassmorphism reutilizables ── */
  const estiloGlass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.6) 0%, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.3) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Estadísticas del servicio de agua en Cartagena">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            marginBottom: '0.5rem',
            color: 'var(--color-tinta)',
            letterSpacing: '-0.5px',
            fontWeight: '800',
          }}>
            Estadísticas
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem' }}>
            Transparencia y seguimiento del servicio de acueducto en Cartagena.
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
            backgroundColor: usandoDatosReales ? 'var(--color-estado-con)' : 'var(--color-estado-baja)',
            display: 'inline-block'
          }}></span>
          {cargando
            ? 'Cargando datos de Acuacar...'
            : usandoDatosReales
              ? `✅ ${boletines.length} boletines oficiales de acuacar.com (API WordPress REST)`
              : '⚠️ Sin datos reales — la API de Acuacar no respondió'}
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
              titulo: 'Boletines Oficiales',
              valor: totalAnimado.toLocaleString(),
              sub: usandoDatosReales ? 'Publicados por Acuacar' : 'Sin datos',
              Icono: Newspaper,
              gradiente: 'linear-gradient(135deg, #0066cc 0%, #2997ff 100%)',
              colorIcono: '#fff',
            },
            {
              titulo: 'Frecuencia de Publicación',
              valor: kpiFrecuencia,
              sub: 'Promedio entre boletines',
              Icono: Clock,
              gradiente: 'linear-gradient(135deg, #ff3b30 0%, #ff6f61 100%)',
              colorIcono: '#fff',
            },
            {
              titulo: 'Barrios Mencionados',
              valor: barriosAnimado.toLocaleString(),
              sub: 'En boletines recientes',
              Icono: AlertTriangle,
              gradiente: 'linear-gradient(135deg, #ff9500 0%, #ffb340 100%)',
              colorIcono: '#fff',
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
                  color: kpi.colorIcono,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${kpi.gradiente.includes('#0066cc') ? 'rgba(0,102,204,0.35)' : kpi.gradiente.includes('#ff3b30') ? 'rgba(255,59,48,0.35)' : 'rgba(255,149,0,0.35)'}`,
                }}>
                  <Icono size={22} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                  <h3 style={{ color: 'var(--color-tinta-2)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.3rem 0' }}>{kpi.titulo}</h3>
                  <div className="tabular" style={{ color: 'var(--color-tinta)', fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.1', margin: '0', letterSpacing: '-0.5px' }}>{kpi.valor}</div>
                  <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', margin: '0.3rem 0 0 0' }}>{kpi.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════
            Actividad de Boletines (timeline real) — Área chart premium
           ════════════════════════════════════════════════════════════ */}
        <section style={{
          ...estiloGlass,
          padding: '2rem',
          borderRadius: '2rem',
          marginBottom: '3rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px' }}>Línea de Tiempo de Afectaciones</h2>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
                Histórico diario de boletines publicados por Acuacar y la cantidad de barrios mencionados en ellos.
              </p>
            </div>
            
            {/* Filtro de Periodo — pill premium */}
            <div style={{ display: 'flex', backgroundColor: 'var(--color-superficie)', padding: '0.25rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)' }}>
              <button 
                onClick={() => setPeriodo('30dias')}
                style={{ background: periodo === '30dias' ? 'var(--color-fondo)' : 'transparent', color: periodo === '30dias' ? 'var(--color-tinta)' : 'var(--color-tinta-3)', border: 'none', padding: '0.4rem 1rem', borderRadius: 'var(--radio-pill)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: periodo === '30dias' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
              >
                Últimos 30 días
              </button>
              <button 
                onClick={() => setPeriodo('3meses')}
                style={{ background: periodo === '3meses' ? 'var(--color-fondo)' : 'transparent', color: periodo === '3meses' ? 'var(--color-tinta)' : 'var(--color-tinta-3)', border: 'none', padding: '0.4rem 1rem', borderRadius: 'var(--radio-pill)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: periodo === '3meses' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
              >
                Últimos 3 meses
              </button>
            </div>
          </div>
          
          <div style={{ height: '320px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="skeleton" style={{ width: '80%', height: '200px', borderRadius: '1rem' }}></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                <AreaChart data={datosTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                  <defs>
                    <linearGradient id="colorBoletines" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2997ff" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#2997ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBarrios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff453a" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ff453a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-linea)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="fecha" stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dy={10} fontSize={11} fontWeight={600} minTickGap={40} />
                  <YAxis stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dx={-10} fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-superficie)',
                      border: '1px solid var(--color-linea)',
                      borderRadius: '1rem',
                      backdropFilter: 'blur(16px)',
                      color: 'var(--color-tinta)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      padding: '0.75rem 1rem',
                    }}
                    itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold', padding: '0.2rem 0' }}
                    labelStyle={{ color: 'var(--color-tinta-3)', marginBottom: '0.5rem', fontSize: '0.85rem', borderBottom: '1px solid var(--color-linea)', paddingBottom: '0.4rem' }}
                    labelFormatter={(label) => `📅 Fecha: ${label}`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '0.9rem', color: 'var(--color-tinta)' }} />
                  <Area type="monotone" dataKey="boletines" name="Boletines publicados" stroke="#2997ff" strokeWidth={3} fillOpacity={1} fill="url(#colorBoletines)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2997ff' }} />
                  <Area type="monotone" dataKey="barrios" name="Barrios afectados ese día" stroke="#ff453a" strokeWidth={3} fillOpacity={1} fill="url(#colorBarrios)" activeDot={{ r: 6, strokeWidth: 0, fill: '#ff453a' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Barrios más mencionados (datos reales) — barras con colores premium
           ════════════════════════════════════════════════════════════ */}
        <section ref={seccionBarrasRef} style={{
          ...estiloGlass,
          padding: '2rem',
          borderRadius: '2rem',
          marginBottom: '3rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px' }}>
                Barrios Más Mencionados ({periodo === '30dias' ? 'Últimos 30 días' : 'Últimos 3 meses'})
              </h2>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem' }}>
                Frecuencia de aparición en boletines oficiales de Acuacar en el periodo seleccionado.
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: usandoDatosReales ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radio-pill)',
              border: `1px solid ${usandoDatosReales ? 'rgba(48,209,88,0.2)' : 'rgba(255,69,58,0.2)'}`,
            }}>
              <Activity size={14} color={usandoDatosReales ? '#30d158' : '#ff453a'} style={{ animation: 'pulse-live 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: usandoDatosReales ? '#30d158' : '#ff453a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {usandoDatosReales ? 'Datos Reales' : 'Sin Datos'}
              </span>
            </div>
          </div>
          
          <div style={{ height: datosBarrios.length > 5 ? '360px' : '280px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="skeleton" style={{ height: '24px', borderRadius: '8px', width: `${90 - i * 12}%` }}></div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
                {barrasVisibles && datosBarrios.length > 0 ? (
                  <BarChart data={datosBarrios} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} barSize={18} style={{ outline: 'none' }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="nombre" type="category" stroke="var(--color-tinta)" width={140} axisLine={false} tickLine={false} fontSize={11} fontWeight={600} />
                    <Tooltip 
                      cursor={{ fill: 'var(--color-linea)', opacity: 0.15 }}
                      contentStyle={{
                        backgroundColor: 'var(--color-superficie)',
                        border: '1px solid var(--color-linea)',
                        borderRadius: '1rem',
                        backdropFilter: 'blur(16px)',
                        color: 'var(--color-tinta)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        padding: '0.75rem 1rem',
                      }}
                      itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} menciones`, 'Boletines']}
                    />
                    <Bar dataKey="menciones" radius={[0, 10, 10, 0]} isAnimationActive={true} animationDuration={1200} animationEasing="ease-in-out">
                      {datosBarrios.map((_entry, index) => (
                        <Cell
                          key={`cell-${_entry.nombre}`}
                          fill={COLORES_BARRAS_PREMIUM[index % COLORES_BARRAS_PREMIUM.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-tinta-3)' }}>
                    {datosBarrios.length === 0 ? 'No se encontraron barrios en los boletines.' : ''}
                  </div>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Insight Analytics — generado a partir de datos reales
           ════════════════════════════════════════════════════════════ */}
        {textoInsight && (
          <div className="hover-glowing" style={{
            ...estiloGlass,
            padding: '1.5rem',
            borderRadius: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
            cursor: 'default',
          }}>
            <div style={{
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #0066cc 0%, #2997ff 100%)',
              borderRadius: '1rem',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,102,204,0.3)',
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-tinta)', marginBottom: '0.3rem' }}>Análisis Derivado de Datos Oficiales</h3>
              <p
                style={{ fontSize: '0.85rem', color: 'var(--color-tinta-2)', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: textoInsight }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="hover-glowing" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'transparent',
            color: 'var(--color-tinta-2)',
            border: '1px solid var(--color-linea)',
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radio-pill)',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all var(--transicion)',
          }}>
            <Download size={16} /> Exportar Informe Completo (CSV)
          </button>
        </div>

      </div>
    </main>
  )
}

export default PaginaEstadisticas
