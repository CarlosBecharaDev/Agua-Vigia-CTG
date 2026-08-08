/**
 * PaginaBitacora — M8 (Bitácora pública - UI).
 * 
 * Conectada a datos reales de Acuacar (boletines oficiales).
 * Muestra los boletines parseados con barrios afectados y estado.
 * Fallback automático a mock data si la API no responde.
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { InsigniaEstado } from '../components/InsigniaEstado'
import { obtenerBoletinesRecientes } from '../api/acuacar'
import type { BoletinAcuacar } from '../api/acuacar'
import type { EstadoServicio } from '../types/tipos-dominio'
import { RefreshCw, ExternalLink, MapPin } from 'lucide-react'

// MOCK DATA - Fallback si la API no responde
const MOCK_EVENTOS = [
  {
    id: 'ev-001',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    sector: 'MANGA',
    tipo: 'CONFIRMADO_POR_CONSENSO',
    descripcion: 'Corte confirmado por reporte de vecinos (5 reportes).',
    estadoRelacionado: 'SIN_SERVICIO' as const
  },
  {
    id: 'ev-002',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    sector: 'BOCAGRANDE',
    tipo: 'CORTE_OFICIAL_ANUNCIADO',
    descripcion: 'Mantenimiento preventivo en tubería principal.',
    estadoRelacionado: 'CORTE_PROGRAMADO' as const
  },
  {
    id: 'ev-003',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    sector: 'GETSEMANI',
    tipo: 'SERVICIO_RESTABLECIDO',
    descripcion: 'Servicio reanudado oficialmente.',
    estadoRelacionado: 'CON_SERVICIO' as const
  }
]

// Formateador de fecha simple
const formatearFecha = (isoString: string) => {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat('es-CO', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(d)
}

/** Determina el estado de un boletín analizando su título */
function estadoDeBoletin(titulo: string): EstadoServicio {
  const t = titulo.toLowerCase();
  if (t.includes('interrupción') || t.includes('falla') || t.includes('suspensión') || t.includes('avance del'))
    return 'SIN_SERVICIO';
  if (t.includes('mantenimiento') || t.includes('programad') || t.includes('realizará') || t.includes('intervendrá'))
    return 'CORTE_PROGRAMADO';
  if (t.includes('restablec') || t.includes('normaliz') || t.includes('recuperación'))
    return 'CON_SERVICIO';
  return 'CON_SERVICIO';
}

const PaginaBitacora: FC = () => {
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([])
  const [cargando, setCargando] = useState(true)
  const [usandoDatosReales, setUsandoDatosReales] = useState(false)

  const cargarBoletines = async () => {
    setCargando(true)
    try {
      const datos = await obtenerBoletinesRecientes(20)
      if (datos.length > 0) {
        setBoletines(datos)
        setUsandoDatosReales(true)
      } else {
        setUsandoDatosReales(false)
      }
    } catch {
      setUsandoDatosReales(false)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarBoletines()
  }, [])

  return (
    <main id="contenido-principal" role="main" aria-label="Bitácora pública de interrupciones del servicio">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-tinta)' }}>
            Bitácora Pública
          </h1>
          <button
            onClick={cargarBoletines}
            disabled={cargando}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'none', border: '1px solid var(--color-linea)',
              borderRadius: 'var(--radio-pill)', padding: '0.4rem 1rem',
              fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
              color: 'var(--color-acento)'
            }}
          >
            <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Registro público de boletines oficiales de Acuacar sobre interrupciones y mantenimientos del servicio de agua.
        </p>

        {/* Indicador de fuente de datos */}
        <div
          role="note"
          style={{
            backgroundColor: 'var(--color-superficie)',
            border: '1px solid var(--color-linea)',
            borderRadius: 'var(--radio-md)',
            padding: '0.75rem',
            marginBottom: '2rem',
            fontSize: '0.75rem',
            color: 'var(--color-tinta-2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: usandoDatosReales ? 'var(--color-estado-con)' : 'var(--color-estado-baja)', display: 'inline-block' }}></span>
          {usandoDatosReales
            ? `✅ ${boletines.length} boletines oficiales de acuacar.com (API WordPress REST)`
            : '⚠️ Datos de demostración — la API de Acuacar no respondió'}
        </div>

        {/* Timeline de Boletines Reales o Eventos Mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {usandoDatosReales ? (
            // ── BOLETINES REALES DE ACUACAR ──
            boletines.map(boletin => {
              const estado = estadoDeBoletin(boletin.titulo);
              const tieneBarrios = boletin.barriosAfectados.length > 0;

              return (
                <article 
                  key={boletin.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    backgroundColor: 'var(--color-superficie)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radio-md)',
                    border: '1px solid var(--color-linea)',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Línea vertical decorativa con color del estado */}
                  <div style={{
                    width: '4px',
                    backgroundColor: estado === 'SIN_SERVICIO' ? 'var(--color-estado-sin)'
                      : estado === 'CORTE_PROGRAMADO' ? 'var(--color-estado-baja)'
                      : 'var(--color-estado-con)',
                    borderRadius: '2px'
                  }} />
                  
                  <div style={{ flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-acento)', backgroundColor: 'var(--color-fondo)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)' }}>
                            {boletin.numero}
                          </span>
                          <InsigniaEstado estado={estado} tamaño="sm" />
                        </div>
                        <h2 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--color-tinta)', fontFamily: 'var(--font-display)', lineHeight: 1.4 }}>
                          {boletin.titulo.replace(/^#\d+\s*–?\s*/, '')}
                        </h2>
                        <time dateTime={boletin.fecha} style={{ fontSize: '0.8rem', color: 'var(--color-tinta-3)' }}>
                          {formatearFecha(boletin.fecha)}
                        </time>
                      </div>
                    </header>
                    
                    {/* Barrios afectados extraídos del boletín */}
                    {tieneBarrios && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                          <MapPin size={12} color="var(--color-tinta-3)" />
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-tinta-3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Barrios mencionados ({boletin.barriosAfectados.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {boletin.barriosAfectados.slice(0, 8).map(barrio => (
                            <span key={barrio} style={{
                              fontSize: '0.65rem', fontWeight: '600',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-fondo)',
                              color: 'var(--color-tinta-2)',
                              border: '1px solid var(--color-linea)'
                            }}>
                              {barrio}
                            </span>
                          ))}
                          {boletin.barriosAfectados.length > 8 && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-tinta-3)', padding: '0.15rem 0.4rem' }}>
                              +{boletin.barriosAfectados.length - 8} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enlace a boletín original */}
                    <a
                      href={`https://www.acuacar.com/?p=${boletin.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        marginTop: '0.75rem', fontSize: '0.75rem',
                        color: 'var(--color-acento)', textDecoration: 'none',
                        fontWeight: '500'
                      }}
                    >
                      Ver boletín completo <ExternalLink size={12} />
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            // ── EVENTOS MOCK (fallback) ──
            MOCK_EVENTOS.map(evento => (
              <article 
                key={evento.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  backgroundColor: 'var(--color-superficie)',
                  padding: '1.5rem',
                  borderRadius: 'var(--radio-md)',
                  border: '1px solid var(--color-linea)',
                  position: 'relative'
                }}
              >
                <div style={{ width: '4px', backgroundColor: 'var(--color-linea)', borderRadius: '2px' }} />
                <div style={{ flex: 1 }}>
                  <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-tinta)', fontFamily: 'var(--font-display)' }}>
                        {evento.sector}
                      </h2>
                      <time dateTime={evento.timestamp} style={{ fontSize: '0.8rem', color: 'var(--color-tinta-3)' }}>
                        {formatearFecha(evento.timestamp)}
                      </time>
                    </div>
                    <InsigniaEstado estado={evento.estadoRelacionado} tamaño="sm" />
                  </header>
                  <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.95rem', margin: 0, lineHeight: '1.4' }}>
                    <strong>{evento.tipo.replace(/_/g, ' ')}:</strong> {evento.descripcion}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>

      </div>
    </main>
  )
}

export default PaginaBitacora
