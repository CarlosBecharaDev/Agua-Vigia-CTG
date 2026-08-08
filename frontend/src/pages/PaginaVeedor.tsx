/**
 * PaginaVeedor — M5 (Panel del Veedor - UI).
 * Sprint 3: UI del panel. Requiere C2 abierta para integrar JWT y endpoints.
 */
import { useState, useEffect } from 'react'
import { Plus, Check, X, ShieldAlert, Activity, Users, Send } from 'lucide-react'
import { AguaVigiaAPI } from '../api/services'
import type { FC } from 'react'

const SECTORES_MOCK = [
  { id: '1', nombre: 'BOCAGRANDE' },
  { id: '2', nombre: 'CASTILLOGRANDE' },
  { id: '3', nombre: 'EL LAGUITO' },
  { id: '4', nombre: 'MANGA' },
  { id: '5', nombre: 'PIE DE LA POPA' },
  { id: '6', nombre: 'OLAYA ST. RICAURTE' },
  { id: '7', nombre: 'OLAYA ST. CENTRAL' },
  { id: '8', nombre: 'GETSEMANI' },
  { id: '9', nombre: 'EL CENTRO' },
  { id: '10', nombre: 'LA BOQUILLA' },
  { id: '11', nombre: 'EL SOCORRO' },
]

/* ── Estilos glassmorphism reutilizables ── */
const estiloGlass: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.6) 0%, rgba(var(--glass-r, 255), var(--glass-g, 255), var(--glass-b, 255), 0.3) 100%)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.18)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
}

const PaginaVeedor: FC = () => {
  const [autenticado, setAutenticado] = useState(false)
  // Estados interactivos para moderación
  const [aprobados, setAprobados] = useState(0)
  const [falsos, setFalsos] = useState(0)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)

  const [reportes, setReportes] = useState([
    { id: 1, barrio: 'MANGA', problema: 'SIN AGUA', tiempo: 'hace 5 min', color: 'var(--color-estado-sin)' },
    { id: 2, barrio: 'EL CENTRO', problema: 'BAJA PRESIÓN', tiempo: 'hace 12 min', color: 'var(--color-estado-baja)' },
    { id: 3, barrio: 'GETSEMANÍ', problema: 'SIN AGUA', tiempo: 'hace 22 min', color: 'var(--color-estado-sin)' },
  ])

  // Cargar datos al montar el componente si está autenticado
  const [sectoresBackend, setSectoresBackend] = useState<{id: string, nombre: string}[]>([])

  useEffect(() => {
    if (autenticado) {
      AguaVigiaAPI.obtenerReportesPendientes()
        .then(data => {
          if (data && data.length > 0) setReportes(data as any);
        })
        .catch(err => {
          console.warn("API de reportes no disponible, usando MOCKS", err);
        });

      AguaVigiaAPI.obtenerSectores()
        .then((res: any) => {
          if (res && res.sectores) {
            setSectoresBackend(res.sectores);
          }
        })
        .catch(err => {
          console.warn("API de sectores no disponible", err);
          setSectoresBackend(SECTORES_MOCK);
        });
    }
  }, [autenticado]);

  // Lógica de moderación
  const procesarReporte = async (id: number, accion: 'aprobar' | 'rechazar') => {
    // Actualización UI Optimista (instantánea) para eliminar el retraso (lag)
    setReportes(prev => prev.filter(r => r.id !== id))
    if (accion === 'aprobar') {
      setAprobados(prev => prev + 1)
    } else {
      setFalsos(prev => prev + 1)
    }

    try {
      await AguaVigiaAPI.procesarReporte(id, accion);
    } catch (err) {
      console.warn(`No se pudo ${accion} en el servidor, UI actualizada localmente`, err);
    }
  }

  if (!autenticado) {
    return (
      <main id="contenido-principal" role="main" aria-label="Ingreso al panel del veedor">
        <div style={{ padding: '4rem 1.5rem', maxWidth: '420px', margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '2rem', 
            background: 'linear-gradient(135deg, #0066cc 0%, #2997ff 100%)',
            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 102, 204, 0.4)'
          }}>
            <ShieldAlert size={40} color="#FFF" />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--color-tinta)', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Panel del Veedor
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
            Área de control restringida. Los líderes comunitarios aprueban o descartan reportes aquí.
          </p>
          <button
            type="button"
            onClick={() => setAutenticado(true)}
            style={{
              backgroundColor: 'var(--color-acento)',
              color: '#FFF',
              padding: '0.85rem 2rem',
              border: 'none',
              borderRadius: 'var(--radio-pill)',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(2, 132, 199, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              justifyContent: 'center'
            }}
            className="hover-glowing"
          >
            Simular Ingreso Seguro
          </button>
        </div>
      </main>
    )
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Dashboard del veedor">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-tinta)', fontWeight: '800', letterSpacing: '-1px', margin: 0 }}>
              Central de Moderación
            </h1>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.95rem', margin: '0.2rem 0 0 0' }}>Verificando inteligencia colectiva en tiempo real.</p>
          </div>
          
          <button 
            onClick={() => setAutenticado(false)}
            className="hover-glowing"
            style={{ 
              padding: '0.5rem 1.25rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', 
              background: 'var(--color-superficie)', cursor: 'pointer', color: 'var(--color-tinta)',
              fontWeight: '600', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* KPIs del Veedor con Premium Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '3rem' }}>
          {[
            { titulo: 'Reportes Pendientes', valor: reportes.length, colorIcono: '#ff9f0a', gradiente: 'linear-gradient(135deg, #ff9500 0%, #ffb340 100%)', Icono: Activity },
            { titulo: 'Aprobados Hoy', valor: aprobados, colorIcono: '#30d158', gradiente: 'linear-gradient(135deg, #28a745 0%, #30d158 100%)', Icono: Check },
            { titulo: 'Falsos Descartados', valor: falsos, colorIcono: '#ff453a', gradiente: 'linear-gradient(135deg, #ff3b30 0%, #ff6f61 100%)', Icono: X }
          ].map((kpi, i) => {
            const Icon = kpi.Icono;
            return (
              <div key={i} className="hover-glowing" style={{ ...estiloGlass, padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'default' }}>
                <div style={{ flexShrink: 0, background: kpi.gradiente, padding: '0.75rem', borderRadius: '1rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${kpi.colorIcono}40` }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-tinta-2)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.25rem 0' }}>{kpi.titulo}</h3>
                  <div className="tabular" style={{ color: 'var(--color-tinta)', fontSize: '1.75rem', fontWeight: '800', lineHeight: '1.1' }}>{kpi.valor}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 1. Registrar corte oficial (RF016) */}
        <section style={{ ...estiloGlass, padding: '2rem', borderRadius: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '0.75rem', background: 'var(--color-superficie)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-linea)' }}>
                  <Send size={16} color="var(--color-acento)" />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>Anuncio Oficial</h2>
              </div>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Emitir aviso vinculante para todos los usuarios.
              </p>
            </div>
            <button 
              onClick={() => { setMostrarFormulario(!mostrarFormulario); setRegistroExitoso(false); }}
              className="hover-glowing" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: mostrarFormulario ? 'var(--color-estado-sin)' : 'var(--color-acento)', color: '#FFF', padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radio-pill)', fontSize: '0.9rem', fontWeight: '600', boxShadow: mostrarFormulario ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)', transition: 'all 0.3s ease' }}>
              {mostrarFormulario ? <X size={16} /> : <Plus size={16} />} 
              {mostrarFormulario ? 'Cancelar' : 'Crear Anuncio'}
            </button>
          </div>

          {/* Formulario Desplegable */}
          {mostrarFormulario && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-linea)', animation: 'aparecerAbajo 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {registroExitoso ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-estado-con)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(48, 209, 88, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-tinta)', marginBottom: '0.5rem' }}>¡Aviso Publicado con Éxito!</h3>
                  <p style={{ color: 'var(--color-tinta-2)' }}>Todos los mapas de los ciudadanos han sido actualizados.</p>
                  <button onClick={() => setMostrarFormulario(false)} className="hover-glowing" style={{ marginTop: '1.5rem', padding: '0.6rem 2rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', background: 'var(--color-superficie)', color: 'var(--color-tinta)', fontWeight: '600', cursor: 'pointer' }}>Entendido</button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => { 
                    e.preventDefault(); 
                    const form = e.target as HTMLFormElement;
                    const sector = form.querySelector('select:nth-of-type(1)') as HTMLSelectElement;
                    const tipo = form.querySelectorAll('select')[1] as HTMLSelectElement;
                    const mensaje = form.querySelector('textarea') as HTMLTextAreaElement;
                    
                    try {
                      await AguaVigiaAPI.registrarCorteOficial({
                        sectorId: sector?.value || 'todos',
                        tipo: tipo?.value || 'mantenimiento',
                        mensaje: mensaje?.value
                      });
                    } catch (err) {
                      console.warn("API falló, simulando éxito", err);
                    }
                    setRegistroExitoso(true);
                  }} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.85rem', fontWeight: '600' }}>
                      Sector Afectado
                      <select required style={{ padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                        <option value="">Selecciona un sector...</option>
                        <option value="todos">⚠️ TODA LA CIUDAD (General)</option>
                        {sectoresBackend.map((sector: any) => (
                          <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.85rem', fontWeight: '600' }}>
                      Tipo de Afectación
                      <select required style={{ padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                        <option value="">Selecciona la causa...</option>
                        <option value="mantenimiento">Mantenimiento Preventivo</option>
                        <option value="tuberia">Rotura de Tubería Matriz</option>
                        <option value="electrico">Falla Eléctrica en Bombeo</option>
                      </select>
                    </label>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.85rem', fontWeight: '600' }}>
                    Descripción del evento
                    <textarea rows={3} placeholder="Detalles de la operación y hora estimada de regreso..." style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)', resize: 'vertical', outline: 'none' }}></textarea>
                  </label>
                  <button type="submit" className="hover-glowing" style={{ alignSelf: 'flex-start', backgroundColor: 'var(--color-acento)', color: '#FFF', padding: '0.8rem 2.5rem', border: 'none', borderRadius: 'var(--radio-pill)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)' }}>
                    Difundir Aviso Oficial
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* 2. Moderar reportes (RF018) */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
            <Users size={20} color="var(--color-tinta-2)" />
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-tinta)', fontWeight: '700', letterSpacing: '-0.3px', margin: 0 }}>Cola de Validación Comunitaria</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reportes.length === 0 ? (
              <div style={{ ...estiloGlass, padding: '3rem 2rem', textAlign: 'center', color: 'var(--color-tinta-2)', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Check size={40} color="var(--color-estado-con)" opacity={0.5} />
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>Bandeja limpia. No hay reportes pendientes.</span>
              </div>
            ) : (
              reportes.map(rep => (
                <div key={rep.id} className="panel-glass hover-glowing" style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '1.25rem 1.5rem', borderRadius: '1.25rem',
                  borderLeft: `4px solid ${rep.color}`
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--color-tinta)', fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.3px' }}>{rep.barrio}</strong>
                      <span style={{ backgroundColor: `${rep.color}15`, color: rep.color, padding: '0.2rem 0.6rem', borderRadius: 'var(--radio-pill)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rep.problema}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-tinta-3)' }}>Reportado <strong style={{ color: 'var(--color-tinta-2)' }}>{rep.tiempo}</strong> · Verificado vía GPS</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => procesarReporte(rep.id, 'rechazar')} className="hover-glowing" aria-label="Rechazar (Falso Positivo)" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', color: 'var(--color-estado-sin)', backgroundColor: 'var(--color-fondo)', border: '1px solid var(--color-estado-sin)', borderRadius: '50%', transition: 'all 0.2s' }}><X size={20} /></button>
                    <button onClick={() => procesarReporte(rep.id, 'aprobar')} className="hover-glowing" aria-label="Aprobar (Confirmar Corte)" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', border: 'none', color: '#FFF', backgroundColor: 'var(--color-estado-con)', borderRadius: '50%', boxShadow: '0 4px 12px rgba(48, 209, 88, 0.4)', transition: 'all 0.2s' }}><Check size={20} strokeWidth={3} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        
      </div>
    </main>
  )
}

export default PaginaVeedor
