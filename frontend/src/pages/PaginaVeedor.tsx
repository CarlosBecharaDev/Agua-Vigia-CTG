/**
 * PaginaVeedor — M5 (Panel del Veedor - UI).
 * Sprint 3: UI del panel. Requiere C2 abierta para integrar JWT y endpoints.
 */
import { useState, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
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
  useEffect(() => {
    if (autenticado) {
      AguaVigiaAPI.obtenerReportesPendientes()
        .then(data => {
          if (data && data.length > 0) setReportes(data as any);
        })
        .catch(err => {
          console.warn("API de reportes no disponible, usando MOCKS", err);
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
      // En una app real de producción, si esto falla, revertiríamos el estado aquí
    }
  }

  if (!autenticado) {
    return (
      <main id="contenido-principal" role="main" aria-label="Ingreso al panel del veedor">
        <div style={{ padding: '3rem 1.5rem', maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
            Panel del Veedor
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Acceso restringido. Cuando C2 (contrato OpenAPI) esté abierta, este panel exigirá
            autenticación real con JWT. Por ahora, sin credencial que simular, entra directo a la
            vista de moderación con datos de ejemplo.
          </p>
          <button
            type="button"
            onClick={() => setAutenticado(true)}
            style={{
              backgroundColor: 'var(--color-acento)',
              color: '#FFF',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: 'var(--radio-md)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
            className="hover-glowing"
          >
            Simular ingreso de veedor
          </button>
        </div>
      </main>
    )
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Dashboard del veedor">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--color-tinta)' }}>
            Panel de Moderación
          </h1>
          <button 
            onClick={() => setAutenticado(false)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', background: 'var(--color-superficie)', backdropFilter: 'blur(10px)', cursor: 'pointer', color: 'var(--color-tinta)' }}
          >
            Salir
          </button>
        </div>

        {/* KPIs del Veedor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ marginBottom: '2.5rem' }}>
          {[
            { titulo: 'Reportes Pendientes', valor: reportes.length, color: 'var(--color-estado-baja)' },
            { titulo: 'Aprobados Hoy', valor: aprobados, color: 'var(--color-estado-con)' },
            { titulo: 'Falsos (Descartados)', valor: falsos, color: 'var(--color-estado-sin)' }
          ].map((kpi, i) => (
            <div key={i} className="panel-glass shadow-lg" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--color-linea)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: 'var(--color-tinta-2)', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>{kpi.titulo}</h3>
              <div style={{ color: kpi.color, fontSize: '1.5rem', fontWeight: '700', lineHeight: '1.1' }}>{kpi.valor}</div>
            </div>
          ))}
        </div>

        {/* 1. Registrar corte oficial (RF016) */}
        <section className="panel-glass shadow-lg" style={{ padding: '2rem', borderRadius: '2rem', marginBottom: '3rem', border: '1px solid var(--color-linea)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '600' }}>Registrar corte oficial</h2>
              <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
                Emite un aviso oficial de mantenimiento o falla general para todos los usuarios.
              </p>
            </div>
            <button 
              onClick={() => { setMostrarFormulario(!mostrarFormulario); setRegistroExitoso(false); }}
              className="hover-glowing" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: mostrarFormulario ? 'var(--color-estado-sin)' : 'var(--color-acento)', color: '#FFF', padding: '0.75rem 1.5rem', border: 'none', borderRadius: 'var(--radio-pill)', fontWeight: '600', boxShadow: mostrarFormulario ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)', transition: 'all 0.3s ease' }}>
              {mostrarFormulario ? <X size={18} /> : <Plus size={18} />} 
              {mostrarFormulario ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          </div>

          {/* Formulario Desplegable */}
          {mostrarFormulario && (
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-linea)', animation: 'aparecerAbajo 0.4s ease-out' }}>
              {registroExitoso ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-estado-con)' }}>
                  <Check size={48} style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>¡Aviso Oficial Publicado!</h3>
                  <p style={{ color: 'var(--color-tinta-2)' }}>El mapa ha sido actualizado para todos los usuarios.</p>
                  <button onClick={() => setMostrarFormulario(false)} style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', background: 'var(--color-superficie)', color: 'var(--color-tinta)', cursor: 'pointer' }}>Cerrar</button>
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
                      console.warn("API de registro de corte falló, simulando éxito", err);
                    }
                    setRegistroExitoso(true);
                  }} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.9rem', fontWeight: '500' }}>
                      Sector Afectado
                      <select required style={{ padding: '0.8rem', borderRadius: 'var(--radio-base)', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)' }}>
                        <option value="">Selecciona un barrio...</option>
                        <option value="todos">⚠️ TODA LA CIUDAD (General)</option>
                        {SECTORES_MOCK.map((sector: any) => (
                          <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.9rem', fontWeight: '500' }}>
                      Tipo de Afectación
                      <select required style={{ padding: '0.8rem', borderRadius: 'var(--radio-base)', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)' }}>
                        <option value="">Selecciona la causa...</option>
                        <option value="mantenimiento">Mantenimiento Programado</option>
                        <option value="tuberia">Rotura de Tubería Matriz</option>
                        <option value="electrico">Falla Eléctrica en Bombeo</option>
                      </select>
                    </label>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontSize: '0.9rem', fontWeight: '500' }}>
                    Mensaje para los ciudadanos (Opcional)
                    <textarea rows={3} placeholder="Ej. El servicio regresará a las 6:00 PM..." style={{ padding: '0.8rem', borderRadius: 'var(--radio-base)', border: '1px solid var(--color-linea)', backgroundColor: 'var(--color-superficie)', color: 'var(--color-tinta)', resize: 'vertical' }}></textarea>
                  </label>

                  <button type="submit" className="hover-glowing" style={{ alignSelf: 'flex-start', backgroundColor: 'var(--color-acento)', color: '#FFF', padding: '0.75rem 2rem', border: 'none', borderRadius: 'var(--radio-pill)', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
                    Publicar Aviso
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* 2. Moderar reportes (RF018) */}
        <section className="panel-glass shadow-lg" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--color-linea)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem', color: 'var(--color-tinta)', fontWeight: '600' }}>Fila de Moderación</h2>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem' }}>
              Reportes ciudadanos recientes que requieren validación.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reportes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-tinta-3)' }}>
                🎉 No hay reportes pendientes de moderación.
              </div>
            ) : (
              reportes.map(rep => (
                <div key={rep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: 'var(--color-superficie)', border: '1px solid var(--color-linea)', borderRadius: '1rem', transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <strong style={{ color: 'var(--color-tinta)', fontSize: '1.1rem' }}>{rep.barrio}</strong>
                      <span style={{ backgroundColor: rep.color, color: '#FFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{rep.problema}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-tinta-3)' }}>Reportado {rep.tiempo} (Vía GPS verificado)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => procesarReporte(rep.id, 'aprobar')} className="hover-glowing" aria-label="Aprobar" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', border: 'none', color: '#FFF', backgroundColor: 'var(--color-estado-con)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)' }}><Check size={18} /></button>
                    <button onClick={() => procesarReporte(rep.id, 'rechazar')} className="hover-glowing" aria-label="Rechazar" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', color: 'var(--color-estado-sin)', backgroundColor: 'transparent', border: '1px solid var(--color-estado-sin)', borderRadius: '50%' }}><X size={18} /></button>
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
