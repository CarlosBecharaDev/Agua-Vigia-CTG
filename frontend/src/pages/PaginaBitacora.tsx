/**
 * PaginaBitacora — M8 (Bitácora pública - UI).
 *
 * Conectada a datos reales de Acuacar (boletines oficiales).
 * Muestra los boletines parseados con barrios afectados y estado.
 * Si la API no responde, muestra un estado vacío — nunca datos inventados.
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { InsigniaEstado } from '../components/InsigniaEstado'
import { determinarEstadoBoletin, obtenerBoletinesRecientes } from '../api/acuacar'
import type { BoletinAcuacar } from '../api/acuacar'
import type { EstadoServicio } from '../types/tipos-dominio'
import { RefreshCw, ExternalLink, MapPin, Activity, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'

// Formateador de fecha simple
const formatearFecha = (isoString: string) => {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat('es-CO', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(d)
}

/** Determina el estado de un boletín analizando su título y contenido */
function estadoDeBoletin(titulo: string, contenido: string): EstadoServicio {
  return determinarEstadoBoletin(titulo, contenido)
}

/* ── Estilos glassmorphism reutilizables ── */
const estiloGlass: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.65) 0%, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.3) 100%)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
}

const PaginaBitacora: FC = () => {
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([])
  const [cargando, setCargando] = useState(true)
  const [usandoDatosReales, setUsandoDatosReales] = useState(false)
  const [animarLista, setAnimarLista] = useState(false)

  const cargarBoletines = async () => {
    setCargando(true)
    setAnimarLista(false)
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
      setTimeout(() => setAnimarLista(true), 50)
    }
  }

  useEffect(() => {
    cargarBoletines()
  }, [])

  return (
    <PageWrapper>
      <main id="contenido-principal" role="main" aria-label="Bitácora pública de interrupciones del servicio">
        <div style={{ padding: '2.5rem 1.25rem', maxWidth: '840px', margin: '0 auto' }}>
        
        {/* ENCABEZADO PREMIUM */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: 'clamp(2rem, 5vw, 2.75rem)', 
              fontWeight: '800',
              letterSpacing: '-1px',
              color: 'var(--color-tinta)',
              margin: 0
            }}>
              Bitácora Pública
            </h1>
            <button
              onClick={cargarBoletines}
              disabled={cargando}
              className="hover-glowing"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--color-superficie)', 
                border: '1px solid var(--color-linea)',
                borderRadius: 'var(--radio-pill)', 
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                color: 'var(--color-tinta)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} color="var(--color-acento)" />
              {cargando ? 'Sincronizando...' : 'Actualizar'}
            </button>
          </div>
          
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '600px', margin: 0 }}>
            Registro inmutable de boletines oficiales de Acuacar. Monitorea mantenimientos, suspensiones y restablecimientos del servicio de agua en tiempo real.
          </p>
        </div>

        {/* INDICADOR DE FUENTE DE DATOS TIPO PILL PREMIUM */}
        <div
          role="note"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: usandoDatosReales ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radio-pill)',
            border: `1px solid ${usandoDatosReales ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)'}`,
            marginBottom: '2rem',
          }}
        >
          <Activity size={16} color={usandoDatosReales ? '#30d158' : '#ff453a'} style={{ animation: 'pulse-live 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: usandoDatosReales ? '#30d158' : '#ff453a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {cargando 
              ? 'Conectando con acuacar...' 
              : usandoDatosReales 
                ? `DATOS EN VIVO (${boletines.length} Boletines)`
                : 'SIN DATOS (Sin Conexión)'}
          </span>
        </div>

        {/* LISTA DE EVENTOS (TIMELINE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
          {/* Línea vertical del timeline */}
          <div style={{
            position: 'absolute',
            left: '2rem',
            top: '2rem',
            bottom: '2rem',
            width: '2px',
            background: 'linear-gradient(to bottom, var(--color-linea), transparent)',
            zIndex: 0
          }} />

          {usandoDatosReales ? (
            // ── BOLETINES REALES DE ACUACAR ──
            boletines.map((boletin, index) => {
              const estado = estadoDeBoletin(boletin.titulo, boletin.contenidoTexto);
              const tieneBarrios = boletin.barriosAfectados.length > 0;
              
              const iconoColor = estado === 'SIN_SERVICIO' ? '#ff453a' 
                               : estado === 'CORTE_PROGRAMADO' ? '#ff9f0a' 
                               : '#30d158';
              
              const IconoEstado = estado === 'SIN_SERVICIO' ? AlertTriangle
                                : estado === 'CORTE_PROGRAMADO' ? Info
                                : CheckCircle2;

              return (
                <article 
                  key={boletin.id}
                  className="hover-glowing"
                  style={{
                    ...estiloGlass,
                    display: 'flex',
                    gap: '1.25rem',
                    padding: '1.5rem',
                    borderRadius: '1.5rem',
                    position: 'relative',
                    zIndex: 1,
                    opacity: animarLista ? 1 : 0,
                    transform: animarLista ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
                  }}
                >
                  {/* Icono del Timeline */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--color-superficie)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--color-linea)',
                    boxShadow: `0 4px 12px ${iconoColor}30`,
                    zIndex: 2,
                    position: 'relative'
                  }}>
                    <IconoEstado size={20} color={iconoColor} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-acento)', backgroundColor: 'var(--color-acento)15', padding: '0.2rem 0.6rem', borderRadius: 'var(--radio-pill)' }}>
                            {boletin.numero}
                          </span>
                          <InsigniaEstado estado={estado} tamaño="sm" />
                          <time dateTime={boletin.fecha} style={{ fontSize: '0.75rem', color: 'var(--color-tinta-3)', fontWeight: '600' }}>
                            {formatearFecha(boletin.fecha)}
                          </time>
                        </div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-tinta)', fontWeight: '700', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
                          {boletin.titulo.replace(/^#\d+\s*–?\s*/, '')}
                        </h2>
                      </div>
                    </header>
                    
                    {/* Barrios afectados (Pills premium) */}
                    {tieneBarrios && (
                      <div style={{ marginTop: '1rem', backgroundColor: 'var(--color-superficie)50', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--color-linea)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                          <MapPin size={14} color="var(--color-tinta-3)" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-tinta-2)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Afectación en {boletin.barriosAfectados.length} zonas
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {boletin.barriosAfectados.slice(0, 8).map(barrio => (
                            <span key={barrio} style={{
                              fontSize: '0.75rem', fontWeight: '600',
                              padding: '0.25rem 0.6rem',
                              borderRadius: 'var(--radio-pill)',
                              backgroundColor: 'var(--color-fondo)',
                              color: 'var(--color-tinta)',
                              border: '1px solid var(--color-linea)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                              {barrio}
                            </span>
                          ))}
                          {boletin.barriosAfectados.length > 8 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-tinta-3)', padding: '0.25rem 0.6rem' }}>
                              +{boletin.barriosAfectados.length - 8} sectores más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Enlace al boletín */}
                    <a
                      href={`https://www.acuacar.com/?p=${boletin.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-glowing"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        marginTop: '1.25rem', fontSize: '0.8rem',
                        color: '#FFF', backgroundColor: 'var(--color-acento)', 
                        padding: '0.4rem 1rem', borderRadius: 'var(--radio-pill)',
                        textDecoration: 'none', fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)'
                      }}
                    >
                      Leer documento oficial <ExternalLink size={14} />
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            // ── SIN DATOS — la API de Acuacar no respondió ──
            <div style={{ ...estiloGlass, padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-tinta-2)', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <AlertTriangle size={40} color="var(--color-tinta-3)" opacity={0.5} />
              <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {cargando ? 'Consultando boletines de Acuacar...' : 'Sin boletines disponibles en este momento.'}
              </span>
            </div>
          )}
        </div>

        </div>
      </main>
    </PageWrapper>
  )
}

export default PaginaBitacora
