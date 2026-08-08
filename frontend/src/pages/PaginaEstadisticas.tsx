/**
 * PaginaEstadisticas — M7 (Estadísticas).
 * UI inicial de Dashboard con Recharts usando datos MOCK.
 * Sprint 4: Se conecta con el API cuando C2 se abra.
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

import { Download, AlertTriangle, Clock, TrendingUp, Sparkles } from 'lucide-react'
import { AguaVigiaAPI } from '../api/services'

// Generador de datos dinámicos para el gráfico principal
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const generarDatosPeriodo = (tipo: '30dias' | '3meses') => {
  const datos = [];
  const hoy = new Date(2026, 7, 8); // 8 de Agosto de 2026 (mes 7)
  
  let fechaActual = new Date(hoy);

  if (tipo === '30dias') {
    // 30 días atrás exactos
    fechaActual.setDate(hoy.getDate() - 29);
  } else {
    // Exactamente 3 meses: Desde el 1 de Junio de 2026
    fechaActual = new Date(2026, 5, 1); // mes 5 = Junio
  }

  let i = 0;
  while (fechaActual <= hoy) {
    const diaNum = fechaActual.getDate();
    const mesStr = MESES[fechaActual.getMonth()];
    const año = fechaActual.getFullYear();
    
    const etiqueta = `${diaNum} ${mesStr} ${año}`;
    
    const base = Math.sin(i / 3) * 1.2 + 3.5; 
    const prometida = Number(base.toFixed(1));
    const real = Number((base + (Math.random() * 1.5 - 0.2)).toFixed(1));
    
    datos.push({ 
      fecha: etiqueta, 
      prometida, 
      real 
    });

    // Avanzar la fecha exactamente 1 día siempre
    fechaActual.setDate(fechaActual.getDate() + 1);
    i++;
  }

  // Asegurar que el último dato en la gráfica de 3 meses termine en 8 Ago
  if (datos.length > 0 && datos[datos.length - 1].fecha !== '8 Ago 2026') {
    datos.push({
      fecha: '8 Ago 2026',
      prometida: 4.1,
      real: 4.5
    });
  }

  return datos;
}

const datosSectoresAfectadosInicial = [
  { nombre: 'EL CENTRO', cortes: 12 },
  { nombre: 'MANGA', cortes: 8 },
  { nombre: 'BOCAGRANDE', cortes: 5 },
  { nombre: 'LA BOQUILLA', cortes: 4 },
  { nombre: 'GETSEMANI', cortes: 2 },
]

const PaginaEstadisticas: FC = () => {
  const [periodo, setPeriodo] = useState<'30dias' | '3meses'>('30dias')
  const [datosCumplimiento, setDatosCumplimiento] = useState<any[]>(generarDatosPeriodo('30dias'))
  
  const [datosBarras, setDatosBarras] = useState(datosSectoresAfectadosInicial)
  
  // KPIs
  const [kpiReportes, setKpiReportes] = useState(3452)
  const [kpiTiempoPromedio, _setKpiTiempoPromedio] = useState('4.2 hrs')
  const [kpiBarriosAfectados, _setKpiBarriosAfectados] = useState('8')

  useEffect(() => {
    // Cargar datos de cumplimiento cuando cambie el periodo
    AguaVigiaAPI.obtenerDatosCumplimiento(periodo)
      .then(data => { if (data && data.length > 0) setDatosCumplimiento(data) })
      .catch(err => {
        console.warn("API de cumplimiento no disponible, usando MOCKS", err);
        setDatosCumplimiento(generarDatosPeriodo(periodo));
      });
  }, [periodo]);

  useEffect(() => {
    // Cargar KPIs iniciales y sectores afectados
    AguaVigiaAPI.obtenerKPIs()
      .then(data => {
        if (data) {
          setKpiReportes(data.totalReportesMes);
          _setKpiTiempoPromedio(data.tiempoPromedioCorte);
          _setKpiBarriosAfectados(data.barriosAfectadosHoy.toString());
        }
      })
      .catch(() => console.warn("API de KPIs no disponible, usando MOCKS"));

    AguaVigiaAPI.obtenerSectoresAfectados()
      .then(data => {
        if (data && data.length > 0) setDatosBarras(data);
      })
      .catch(() => console.warn("API de sectores afectados no disponible, usando MOCKS"));
  }, []);
  
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

  // Actualizaciones en Tiempo Real
  useEffect(() => {
    const intervalo = setInterval(() => {
      // Aleatoriamente alguien reporta una nueva falla
      if (Math.random() > 0.3) {
        setKpiReportes(prev => prev + 1)
        
        // Sumamos este nuevo reporte a uno de los sectores al azar
        setDatosBarras(prev => {
          const nuevos = prev.map(p => ({ ...p }))
          const indice = Math.floor(Math.random() * nuevos.length)
          nuevos[indice].cortes += 1
          // Ordenamos para que el peor siempre esté arriba
          return nuevos.sort((a, b) => b.cortes - a.cortes)
        })
      }
    }, 4500)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <main id="contenido-principal" role="main" aria-label="Estadísticas del servicio de agua en Cartagena">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
            Estadísticas
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem' }}>
            Transparencia y seguimiento del servicio de acueducto en Cartagena.
          </p>
        </div>

        {/* KPIs (Métricas rápidas clave) */}
        {/* TODO M5: Reemplazar estas métricas por las que envíe C2 desde el servidor real */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '3.5rem' }}>
          {[
            { titulo: 'Total Reportes Mes', valor: kpiReportes.toLocaleString(), sub: '+12% vs mes anterior', Icono: TrendingUp, color: 'var(--color-acento)' },
            { titulo: 'Tiempo Promedio de Corte', valor: kpiTiempoPromedio, sub: 'Meta: < 3 hrs', Icono: Clock, color: 'var(--color-estado-sin)' },
            { titulo: 'Barrios Afectados Hoy', valor: kpiBarriosAfectados, sub: 'De 120 barrios totales', Icono: AlertTriangle, color: 'var(--color-estado-baja)' }
          ].map((kpi, i) => {
            const Icono = kpi.Icono
            return (
              <div key={i} className="panel-glass shadow-lg" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--color-linea)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ flexShrink: 0, backgroundColor: 'var(--color-superficie)', padding: '1rem', borderRadius: '50%', color: kpi.color, border: `1px solid ${kpi.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icono size={22} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                  <h3 style={{ color: 'var(--color-tinta-2)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.3rem 0' }}>{kpi.titulo}</h3>
                  <div style={{ color: 'var(--color-tinta)', fontSize: '1.25rem', fontWeight: '700', lineHeight: '1.1', margin: '0' }}>{kpi.valor}</div>
                  <div style={{ color: 'var(--color-tinta-3)', fontSize: '0.7rem', margin: '0.3rem 0 0 0' }}>{kpi.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Indice de Cumplimiento (RF024) */}
        <section className="panel-glass" style={{ padding: '2rem', borderRadius: '2rem', marginBottom: '3rem', border: '1px solid var(--color-linea)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '600' }}>Tiempo Prometido vs Real</h2>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
                Comparativa de duración de cortes reportados vs. programados.
              </p>
            </div>
            
            {/* Filtro de Periodo */}
            <div style={{ display: 'flex', backgroundColor: 'var(--color-superficie)', padding: '0.25rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)' }}>
              <button 
                onClick={() => setPeriodo('30dias')}
                style={{ background: periodo === '30dias' ? 'var(--color-fondo)' : 'transparent', color: periodo === '30dias' ? 'var(--color-tinta)' : 'var(--color-tinta-3)', border: 'none', padding: '0.4rem 1rem', borderRadius: 'var(--radio-pill)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: periodo === '30dias' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
              >
                Ago (Últimos 30 días)
              </button>
              <button 
                onClick={() => setPeriodo('3meses')}
                style={{ background: periodo === '3meses' ? 'var(--color-fondo)' : 'transparent', color: periodo === '3meses' ? 'var(--color-tinta)' : 'var(--color-tinta-3)', border: 'none', padding: '0.4rem 1rem', borderRadius: 'var(--radio-pill)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: periodo === '3meses' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}
              >
                Jun - Ago (3 meses)
              </button>
            </div>
          </div>
          
          <div style={{ height: '320px', width: '100%', outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <AreaChart data={datosCumplimiento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                <defs>
                  <linearGradient id="colorPrometida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-acento)" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="var(--color-acento)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-estado-sin)" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="var(--color-estado-sin)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-linea)" vertical={false} opacity={0.5} />
                <XAxis dataKey="fecha" stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dy={10} fontSize={11} fontWeight={600} minTickGap={30} />
                <YAxis stroke="var(--color-tinta-3)" axisLine={false} tickLine={false} dx={-10} fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-superficie)', border: '1px solid var(--color-linea)', borderRadius: '1rem', backdropFilter: 'blur(10px)', color: 'var(--color-tinta)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                  itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--color-tinta-3)', marginBottom: '0.5rem', fontSize: '0.85rem' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '0.9rem', color: 'var(--color-tinta)' }} />
                <Area type="monotone" dataKey="prometida" name="Tiempo Prometido (h)" stroke="var(--color-acento)" strokeWidth={3} fillOpacity={1} fill="url(#colorPrometida)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="real" name="Tiempo Real (h)" stroke="var(--color-estado-sin)" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Sectores más afectados (RF023) */}
        <section ref={seccionBarrasRef} className="panel-glass" style={{ padding: '2rem', borderRadius: '2rem', marginBottom: '3rem', border: '1px solid var(--color-linea)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-tinta)', fontWeight: '600' }}>Cortes por Sector (En Vivo)</h2>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem' }}>
                Sectores con mayor inestabilidad actualizándose en tiempo real.
              </p>
            </div>
            <div className="pulse-dot" style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-estado-sin)', borderRadius: '50%' }} title="Conexión en vivo activa"></div>
          </div>
          
          <div style={{ height: '280px', width: '100%', outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              {barrasVisibles ? (
                <BarChart data={datosBarras} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }} barSize={16} style={{ outline: 'none' }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nombre" type="category" stroke="var(--color-tinta)" width={120} axisLine={false} tickLine={false} fontSize={11} fontWeight={600} />
                  <Tooltip 
                    cursor={{ fill: 'var(--color-linea)', opacity: 0.2 }}
                    contentStyle={{ backgroundColor: 'var(--color-superficie)', border: '1px solid var(--color-linea)', borderRadius: '1rem', backdropFilter: 'blur(10px)', color: 'var(--color-tinta)' }}
                    itemStyle={{ color: 'var(--color-tinta)', fontWeight: 'bold' }}
                    formatter={(value: any) => [`${value} Cortes`, 'Reportes']}
                  />
                  <Bar dataKey="cortes" radius={[0, 8, 8, 0]} isAnimationActive={true} animationDuration={1000} animationEasing="ease-in-out">
                    {datosBarras.map((entry, index) => (
                      <Cell key={`cell-${entry.nombre}`} fill={index === 0 ? 'var(--color-estado-sin)' : 'var(--color-acento)'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div style={{ width: '100%', height: '100%' }}></div>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Insight Analytics (Mensaje de crecimiento/decrecimiento) */}
        <div className="panel-glass shadow-lg" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--color-linea)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-superficie)', borderRadius: '50%', color: 'var(--color-acento)', border: '1px solid var(--color-linea)', flexShrink: 0 }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-tinta)', marginBottom: '0.3rem' }}>Análisis Predictivo de la Comunidad</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-tinta-2)', lineHeight: '1.6' }}>
              Se observa un <strong>crecimiento del 12%</strong> en la frecuencia de reportes durante las últimas dos semanas, particularmente liderado por el sector <strong>El Centro</strong>. A pesar del incremento en los incidentes, la <strong>duración real de los cortes ha disminuido</strong> un 8% respecto a junio. La tendencia proyecta una estabilización general del servicio para finales de agosto si se mantienen las reparaciones actuales.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="hover-glowing" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', color: 'var(--color-tinta-2)', border: '1px solid var(--color-linea)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radio-pill)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all var(--transicion)' }}>
            <Download size={16} /> Exportar Informe Completo (CSV)
          </button>
        </div>

      </div>
    </main>
  )
}

export default PaginaEstadisticas
