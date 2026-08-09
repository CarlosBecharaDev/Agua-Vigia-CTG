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
import { PageWrapper } from '../components/PageWrapper'

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
    return `¡Excelentes noticias! No he detectado interrupciones oficiales en las gráficas para ${periodo === '30dias' ? 'los últimos 30 días' : 'los últimos 3 meses'}. La estabilidad del servicio ha sido del 100%.`;
  }

  const intros = [
    `He analizado las gráficas. En ${periodo === '30dias' ? 'los últimos 30 días' : 'el último trimestre'},`,
    `Observando los patrones de los datos de ${periodo === '30dias' ? 'este último mes' : 'los últimos 90 días'},`,
    `De acuerdo a la línea de tiempo, en ${periodo === '30dias' ? 'estos 30 días' : 'este periodo de 3 meses'},`
  ];
  const intro = intros[Math.floor(Math.random() * intros.length)];

  const partes: string[] = [];
  partes.push(`${intro} Acuacar emitió <strong>${total} boletines oficiales</strong> que afectaron directamente a <strong>${barriosUnicos.size} sectores</strong> distintos.`);

  if (tendencia > 0) {
    partes.push(`Hay una tendencia negativa: esto representa un alarmante <strong>aumento del ${tendencia}%</strong> en comparación con el periodo inmediatamente anterior.`);
  } else if (tendencia < 0) {
    partes.push(`Lo positivo es que esto muestra una <strong>disminución del ${Math.abs(tendencia)}%</strong> respecto al periodo anterior.`);
  } else {
    partes.push(`La frecuencia de problemas se ha mantenido constante respecto al periodo anterior, sin picos inusuales.`);
  }

  if (barriosTop.length > 0) {
    const peor = barriosTop[0];
    partes.push(`Si miramos el gráfico de barras, es evidente que <strong>${peor.nombre}</strong> es la zona más vulnerable, liderando con ${peor.menciones} menciones.`);
    if (barriosTop.length > 2) {
      partes.push(`Otras áreas críticas que requieren atención son ${barriosTop[1].nombre} y ${barriosTop[2].nombre}.`);
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
  
  // Estado para la IA simulada
  const [textoInsight, setTextoInsight] = useState('')
  const [analizandoIA, setAnalizandoIA] = useState(false)
  const [insightVisible, setInsightVisible] = useState('')

  // Efecto de "Analizando datos..."
  useEffect(() => {
    if (!textoInsight) return
    setAnalizandoIA(true)
    const timeout = setTimeout(() => {
      setAnalizandoIA(false)
      setInsightVisible(textoInsight)
    }, 1500) // 1.5 segundos simulando "pensar"
    return () => clearTimeout(timeout)
  }, [textoInsight])

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

    // Insight (Nuevo texto)
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

  /* ── Lógica de Exportación HTML Interactivo (Offline - Interactivo Puro Animado) ── */
  const generarInformeHTML = () => {
    if (boletines.length === 0) return;

    const fechaGeneracion = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const coloresPremium = ['#ff453a', '#ff9f0a', '#ffcc00', '#30d158', '#0ea5e9', '#af52de', '#ff6f61', '#2997ff'];

    // Función auxiliar para generar el bloque de gráficas según el periodo
    const generarBloqueGraficas = (p: '30dias' | '3meses') => {
      const dTimeline = agruparBoletinesPorDia(boletines, p);
      const dBarrios = contarBarriosMasAfectados(boletines, p);
      const tituloP = p === '30dias' ? 'Últimos 30 días' : 'Últimos 3 meses';
      
      const insight = generarInsight(boletines, dBarrios, p);

      const maxBarrios = Math.max(...dBarrios.map(d => d.menciones), 1);
      const maxTL = Math.max(...dTimeline.map(d => Math.max(d.boletines, d.barrios)), 1);

      const chartBarriosHTML = `
        <div class="css-barchart">
          ${dBarrios.map((d, i) => `
            <div class="css-bar-row" style="animation-delay: ${i * 0.05}s" data-tooltip="${d.nombre}<br><b style='color:${coloresPremium[i % coloresPremium.length]}'>${d.menciones} menciones</b>">
              <div class="css-bar-label">${d.nombre}</div>
              <div class="css-bar-track">
                <div class="css-bar-fill" style="width: ${(d.menciones / maxBarrios) * 100}%; background: ${coloresPremium[i % coloresPremium.length]}"></div>
              </div>
              <div class="css-bar-value">${d.menciones}</div>
            </div>
          `).join('')}
        </div>
      `;

      const mostrarEtiqueta = (i: number, total: number) => {
        if (total <= 15) return true;
        if (total <= 30) return i % 2 === 0;
        return i % 5 === 0;
      };

      const svgW = 800;
      const svgH = 240;
      const padX = 30;
      const padY = 30;
      
      const getX = (index: number) => padX + (index / Math.max(dTimeline.length - 1, 1)) * (svgW - 2 * padX);
      const getY = (val: number) => svgH - padY - (val / maxTL) * (svgH - 2 * padY);

      const ptsBoletines = dTimeline.map((d, i) => `${getX(i)},${getY(d.boletines)}`).join(' ');
      const areaBoletines = `${getX(0)},${svgH - padY} ${ptsBoletines} ${getX(dTimeline.length - 1)},${svgH - padY}`;

      const ptsBarrios = dTimeline.map((d, i) => `${getX(i)},${getY(d.barrios)}`).join(' ');
      const areaBarrios = `${getX(0)},${svgH - padY} ${ptsBarrios} ${getX(dTimeline.length - 1)},${svgH - padY}`;

      // Usar prefijo aleatorio para los defs SVG para evitar conflictos entre los dos bloques
      const prefix = p;

      const chartTimelineHTML = `
        <div class="svg-container">
          <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" class="svg-animado">
            <defs>
              <linearGradient id="gradBarrios${prefix}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="#ff453a" stop-opacity="0.3"/>
                <stop offset="95%" stop-color="#ff453a" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="gradBoletines${prefix}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="#2997ff" stop-opacity="0.4"/>
                <stop offset="95%" stop-color="#2997ff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line x1="${padX}" y1="${svgH - padY}" x2="${svgW - padX}" y2="${svgH - padY}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            
            <polygon points="${areaBarrios}" fill="url(#gradBarrios${prefix})" class="area-svg" />
            <polyline points="${ptsBarrios}" fill="none" stroke="rgba(255, 69, 58, 0.7)" stroke-width="2" class="line-svg" pathLength="1" />
            
            <polygon points="${areaBoletines}" fill="url(#gradBoletines${prefix})" class="area-svg" />
            <polyline points="${ptsBoletines}" fill="none" stroke="rgba(41, 151, 255, 0.8)" stroke-width="3" class="line-svg" pathLength="1" />
            
            ${dTimeline.map((d, i) => mostrarEtiqueta(i, dTimeline.length) ? 
              `<text x="${getX(i)}" y="${svgH - 10}" fill="var(--tinta-suave)" font-size="10" font-weight="600" text-anchor="middle" class="fade-in-up" style="animation-delay:${i*0.02}s">${d.fecha}</text>` : ''
            ).join('')}
            
            ${dTimeline.map((d, i) => `
              <circle cx="${getX(i)}" cy="${getY(d.boletines)}" r="4" fill="#2997ff" class="dot-svg" style="animation-delay:${i*0.02}s" pointer-events="none"/>
              <circle cx="${getX(i)}" cy="${getY(d.barrios)}" r="3" fill="#ff453a" class="dot-svg" style="animation-delay:${i*0.02}s" pointer-events="none"/>
            `).join('')}

            ${dTimeline.map((d, i) => {
              const anchoColumna = (svgW - 2 * padX) / Math.max(dTimeline.length, 1);
              return `
              <rect x="${getX(i) - anchoColumna / 2}" y="0" width="${anchoColumna}" height="${svgH}" fill="transparent" class="hover-rect"
                data-tooltip="📅 <b>${d.fecha}</b><br><span style='color:#2997ff'>📘 Boletines: ${d.boletines}</span><br><span style='color:#ff453a'>🏘️ Barrios Afectados: ${d.barrios}</span>"
              />
            `}).join('')}
          </svg>
        </div>
        <div class="leyenda-timeline fade-in-up" style="animation-delay: 0.6s">
          <span style="color:#2997ff;">■ Boletines Emitidos</span>
          <span style="color:#ff453a;">■ Barrios Afectados</span>
        </div>
      `;

      return `
        <div class="seccion-graficas fade-in-up">
          <div style="margin-bottom:1.5rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem;">
            <h2 style="color:var(--tinta); font-size:1.8rem; margin:0;">Análisis: <span style="color:var(--acento)">${tituloP}</span></h2>
          </div>
          
          <div class="insight-card fade-in-up" style="animation-delay: 0.1s">
            <div class="insight-header">
              <span>✨</span> Resumen Automatizado de Vigía
            </div>
            <p class="insight-text">${insight}</p>
          </div>

          <div class="grafica-card fade-in-up" style="animation-delay: 0.2s">
            <h2>Línea de Tiempo Operativa</h2>
            ${chartTimelineHTML}
          </div>
          <div class="grafica-card fade-in-up" style="animation-delay: 0.4s">
            <h2>Impacto por Sectores</h2>
            ${chartBarriosHTML}
          </div>
        </div>
      `;
    };

    const graficas3Meses = generarBloqueGraficas('3meses');
    const graficas30Dias = generarBloqueGraficas('30dias');

    // Tarjetas informativas con URL oficial
    const tarjetasHTML = boletines.map((b, i) => `
      <a href="${b.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;" class="boletin-item-link" data-busqueda="${(b.titulo + ' ' + b.barriosAfectados.join(' ') + ' ' + b.contenidoTexto).toLowerCase()}">
        <article class="glass-card fade-in-up" style="animation-delay: ${(i % 15) * 0.05}s">
          <div class="fecha-badge">📅 ${b.fecha.split('T')[0]} 🔗 Ver Oficial</div>
          <h3 class="titulo-boletin">${b.titulo}</h3>
          <p class="motivo-boletin">${b.contenidoTexto ? b.contenidoTexto.substring(0, 150) + '...' : 'Sin descripción detallada.'}</p>
          <div class="barrios-container">
            <div class="barrios-label">Barrios Afectados (${b.barriosAfectados.length})</div>
            <div class="barrios-tags">
              ${b.barriosAfectados.slice(0, 6).map(barrio => `<span class="tag">${barrio}</span>`).join('')}
              ${b.barriosAfectados.length > 6 ? `<span class="tag-more">+${b.barriosAfectados.length - 6} más</span>` : ''}
            </div>
          </div>
        </article>
      </a>
    `).join('');

    const htmlCompleto = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe AguaVigía - Completo</title>
  <style>
    /* ── Apple Premium Dark Mode Animado (100% Offline) ── */
    :root {
      --bg: #000000;
      --tinta: #f5f5f7;
      --tinta-suave: #a1a1a6;
      --acento: #2997ff;
      --borde: rgba(255, 255, 255, 0.1);
      --glass-bg: rgba(28, 28, 30, 0.65);
      --font-display: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    body {
      margin: 0; padding: 0;
      background-color: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 30%, rgba(0, 102, 204, 0.15) 0%, transparent 40%), 
        radial-gradient(circle at 85% 70%, rgba(41, 151, 255, 0.1) 0%, transparent 40%);
      background-attachment: fixed;
      font-family: var(--font-display);
      color: var(--tinta);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Animaciones Globales */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes growBar {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    @keyframes growColumn {
      from { transform: scaleY(0); }
      to { transform: scaleY(1); }
    }
    
    .fade-in-up {
      opacity: 0;
      animation: fadeInUp 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 3rem 1.5rem; }
    
    header {
      display: flex; justify-content: space-between; align-items: flex-end;
      border-bottom: 1px solid var(--borde); padding-bottom: 2rem; margin-bottom: 3rem;
      flex-wrap: wrap; gap: 1rem;
    }
    h1 { 
      margin: 0; font-size: 3rem; font-weight: 800; 
      background: linear-gradient(135deg, #fff 0%, #a1a1a6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      letter-spacing: -1px; 
    }
    .header-sub { margin: 0.5rem 0 0 0; color: var(--acento); font-size: 1.1rem; font-weight: 600; letter-spacing: -0.3px; }
    .meta-info { text-align: right; }
    .meta-info p { margin: 0 0 0.3rem 0; font-weight: 600; color: #fff; }
    .meta-info span { font-size: 0.85rem; color: var(--tinta-suave); }
    
    /* ── Gráficas Premium Interactivas Offline ── */
    .seccion-graficas { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 5rem; }
    .grafica-card {
      background: var(--glass-bg); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--borde); border-radius: 1.5rem; padding: 2rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    .grafica-card h2 { margin: 0 0 1.5rem 0; font-size: 1.3rem; color: #fff; letter-spacing: -0.5px; }

    /* Tooltip Custom Flotante */
    .custom-tooltip {
      position: absolute; display: none; background: rgba(28,28,30,0.9);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 0.75rem;
      padding: 0.75rem 1rem; color: #fff; font-size: 0.85rem; font-weight: 500;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8); backdrop-filter: blur(10px);
      pointer-events: none; z-index: 1000; line-height: 1.4;
      transition: opacity 0.2s ease, transform 0.1s ease;
    }

    /* Gráfica Barras Horizontales */
    .css-barchart { display: flex; flex-direction: column; gap: 0.6rem; max-height: 320px; overflow-y: auto; padding-right: 10px; }
    .css-bar-row { display: flex; align-items: center; gap: 1rem; cursor: crosshair; opacity: 0; animation: fadeInUp 0.6s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
    .css-bar-row:hover .css-bar-fill { filter: brightness(1.3); }
    .css-bar-label { width: 140px; font-size: 0.75rem; text-align: right; color: var(--tinta-suave); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
    .css-bar-track { flex: 1; background: rgba(255,255,255,0.05); height: 16px; border-radius: 8px; overflow: hidden; }
    .css-bar-fill { height: 100%; border-radius: 8px; transform-origin: left; animation: growBar 1.2s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
    .css-bar-value { width: 30px; font-size: 0.75rem; color: #fff; font-weight: 700; }

    /* Gráfica de Área (Línea de Tiempo SVG) */
    .svg-container { width: 100%; height: 260px; position: relative; margin-bottom: 0.5rem; }
    .svg-animado .area-svg { opacity: 0; animation: fadeIn 1s 0.6s forwards; }
    /* Se usa pathLength="1" en el HTML para que el dashoffset funcione impecable sin importar lo larga que sea la línea */
    .svg-animado .line-svg { stroke-dasharray: 1; stroke-dashoffset: 1; animation: drawLine 2.5s 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    .svg-animado .dot-svg { opacity: 0; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: center; transform-box: fill-box; }
    .hover-rect:hover { fill: rgba(255,255,255,0.05); cursor: crosshair; }
    
    @keyframes drawLine { to { stroke-dashoffset: 0; } }
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    
    .leyenda-timeline { display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; font-size: 0.8rem; font-weight: 600; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 6px; }

    .controles { margin-bottom: 2.5rem; }
    .controles h2 { margin-bottom: 1.2rem; font-size: 1.5rem; color: #fff; font-weight: 700; letter-spacing: -0.5px; }
    .buscador {
      width: 100%; max-width: 450px; padding: 1rem 1.5rem;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 99px;
      font-size: 1rem; outline: none; background: rgba(255,255,255,0.05);
      color: #fff; backdrop-filter: blur(10px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3); transition: all 0.3s ease;
    }
    .buscador::placeholder { color: var(--tinta-suave); }
    .buscador:focus { border-color: var(--acento); background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(41, 151, 255, 0.15); }

    /* Tarjeta de Insight / Retroalimentación IA */
    .insight-card {
      background: linear-gradient(135deg, rgba(41, 151, 255, 0.1) 0%, rgba(41, 151, 255, 0.02) 100%);
      border: 1px solid rgba(41, 151, 255, 0.2);
      border-radius: 1rem; padding: 1.5rem; margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .insight-header { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--acento); margin-bottom: 0.8rem; font-size: 1.1rem; }
    .insight-text { font-size: 1rem; color: #fff; line-height: 1.6; margin: 0; }
    .insight-text strong { color: var(--acento); font-weight: 700; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    
    .boletin-item-link { display: block; outline: none; }
    /* Glassmorphism Dark Cards */
    .glass-card {
      background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--borde); border-radius: 1.25rem; padding: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      transition: transform 0.3s ease, background 0.3s ease; display: flex; flex-direction: column;
      height: 100%; box-sizing: border-box;
    }
    .glass-card:hover { transform: translateY(-4px); background: rgba(40, 40, 44, 0.75); border-color: rgba(255,255,255,0.3); }
    
    .fecha-badge {
      display: inline-block; padding: 0.3rem 0.8rem; background: rgba(41, 151, 255, 0.15);
      color: var(--acento); font-size: 0.75rem; font-weight: 700; border-radius: 99px; margin-bottom: 1.2rem; align-self: flex-start;
      border: 1px solid rgba(41, 151, 255, 0.3); transition: all 0.2s ease;
    }
    .glass-card:hover .fecha-badge { background: var(--acento); color: #fff; }

    .titulo-boletin { margin: 0 0 0.5rem 0; font-size: 1.15rem; line-height: 1.35; font-weight: 700; color: #fff; }
    .motivo-boletin { font-size: 0.95rem; color: var(--tinta-suave); margin: 0 0 1.5rem 0; }
    
    .barrios-container { margin-top: auto; }
    .barrios-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--acento); margin-bottom: 0.6rem; }
    .barrios-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .tag { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.05); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem; color: var(--tinta); font-weight: 500; }
    .tag-more { background: transparent; padding: 0.2rem 0.3rem; font-size: 0.75rem; font-weight: 600; color: var(--tinta-suave); }
    
    @media (max-width: 600px) { header { flex-direction: column; align-items: flex-start; } .meta-info { text-align: left; } }
  </style>
</head>
<body>
  <!-- Div global para los Tooltips flotantes -->
  <div id="hover-tooltip" class="custom-tooltip"></div>

  <div class="container">
    <header class="fade-in-up">
      <div>
        <h1>AguaVigía</h1>
        <p class="header-sub">Reporte de Estado Analítico Integral</p>
      </div>
      <div class="meta-info">
        <p>Periodo: Consolidado Total</p>
        <span>Generado el: ${fechaGeneracion}</span>
      </div>
    </header>

    ${graficas3Meses}
    ${graficas30Dias}

    <div class="controles fade-in-up" style="animation-delay: 0.4s">
      <h2>Directorio de Novedades (${boletines.length})</h2>
      <input type="text" id="buscador" class="buscador" placeholder="Buscar barrio, sector o título...">
    </div>

    <div class="grid" id="grid-boletines">
      ${tarjetasHTML}
    </div>
  </div>

  <script>
    // Lógica del buscador
    const buscador = document.getElementById('buscador');
    const items = document.querySelectorAll('.boletin-item-link');
    buscador.addEventListener('input', (e) => {
      const termino = e.target.value.toLowerCase();
      items.forEach(item => {
        const texto = item.getAttribute('data-busqueda');
        item.style.display = texto.includes(termino) ? 'block' : 'none';
      });
    });

    // Lógica del Tooltip Interactivo 100% Offline
    const tooltip = document.getElementById('hover-tooltip');
    let frameId;
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          tooltip.innerHTML = el.getAttribute('data-tooltip');
          tooltip.style.display = 'block';
          tooltip.style.opacity = '1';
          
          // Ajuste de posición para que no se salga de la pantalla
          let left = e.pageX + 15;
          let top = e.pageY + 15;
          const rect = tooltip.getBoundingClientRect();
          if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 15;
          
          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';
        });
      });
      el.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        setTimeout(() => { if (tooltip.style.opacity === '0') tooltip.style.display = 'none'; }, 200);
      });
    });
  </script>
</body>
</html>`;

    // Descargar como archivo HTML (Offline completo)
    const blob = new Blob([htmlCompleto], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Aguavigia_Offline_Dark_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── Estilos glassmorphism reutilizables ── */
  const estiloGlass: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.6) 0%, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.3) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
  }

  return (
    <PageWrapper>
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
          
          <div id="chart-timeline" style={{ height: '320px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="skeleton" style={{ width: '80%', height: '200px', borderRadius: '1rem' }}></div>
              </div>
            ) : datosTimeline.length === 0 ? (
              <div
                role="status"
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-tinta-3)', padding: '2rem', lineHeight: 1.5 }}
              >
                Aun no hay suficientes boletines oficiales para construir esta linea de tiempo.
                <br />Vuelve a intentarlo cuando la fuente de datos este disponible.
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
          
          <div id="chart-barrios" style={{ height: datosBarrios.length > 5 ? '360px' : '280px', width: '100%', outline: 'none' }}>
            {cargando ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="skeleton" style={{ height: '24px', borderRadius: '8px', width: `${90 - i * 12}%` }}></div>
                ))}
              </div>
            ) : datosBarrios.length === 0 ? (
              <div
                role="img"
                aria-label="No hay datos disponibles de barrios para el periodo seleccionado"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2rem',
                  boxSizing: 'border-box',
                  opacity: 0.35,
                }}
              >
                {[42, 68, 52, 30].map((width, index) => (
                  <div
                    key={index}
                    aria-hidden="true"
                    style={{
                      width: `${width}%`,
                      height: '0.65rem',
                      borderRadius: 'var(--radio-pill)',
                      background: 'var(--color-linea)',
                    }}
                  />
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
            Insight Analytics — generado a partir de datos reales con IA simulada
           ════════════════════════════════════════════════════════════ */}
        {textoInsight && (
          <div className="hover-glowing" style={{
            ...estiloGlass,
            padding: '1.5rem',
            borderRadius: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'flex-start',
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #0066cc 0%, #2997ff 100%)',
              borderRadius: '1rem',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,102,204,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={24} style={{ animation: analizandoIA ? 'pulse-live 1s infinite' : 'none' }} />
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-tinta)', marginBottom: '0.4rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {analizandoIA ? 'Analizando gráficas y buscando patrones...' : 'Conclusión Automática del Sistema'}
              </h3>
              
              {analizandoIA ? (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-acento)', borderRadius: '50%', animation: 'pulse-live 1s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-acento)', borderRadius: '50%', animation: 'pulse-live 1s infinite 0.2s' }}></div>
                  <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-acento)', borderRadius: '50%', animation: 'pulse-live 1s infinite 0.4s' }}></div>
                </div>
              ) : (
                <p
                  style={{ fontSize: '0.9rem', color: 'var(--color-tinta-2)', lineHeight: '1.6', margin: 0, animation: 'aparecerAbajo 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  dangerouslySetInnerHTML={{ __html: insightVisible }}
                />
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            onClick={generarInformeHTML}
            title={boletines.length === 0 ? "No hay datos para exportar" : "Descargar documento HTML interactivo"}
            className="hover-glowing" style={{
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
            <Download size={16} /> Descargar Informe Interactivo
          </button>
        </div>
        </div>
      </main>
    </PageWrapper>
  )
}

export default PaginaEstadisticas
