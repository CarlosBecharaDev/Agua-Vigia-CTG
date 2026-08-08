/**
 * PaginaMapa — M1 (Mapa en vivo) + lista accesible (RF004).
 *
 * Sprint 1: usa datos mock locales hasta que C2 abra y se pueda
 * conectar GET /api/sectores. Los tipos, colores y componentes
 * son definitivos — solo la fuente de datos cambiará.
 *
 * DESIGN.md §1: responde "¿tengo agua?" en menos de 5 segundos.
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { FeedComentarios } from '../components/FeedComentarios'
import { ModalReporte } from '../components/ModalReporte'
import type { Sector } from '../types/tipos-dominio'
import { Megaphone } from 'lucide-react'

// ──────────────────────────────────────────────────────────────
// DATOS MOCK — se reemplazarán con GET /api/sectores cuando C2 abra.
// Los nombres coinciden con el GeoJSON de D5 (barrios-cartagena.geojson).
// NO son tipos inventados: siguen la interfaz Sector de tipos-dominio.ts.
// ──────────────────────────────────────────────────────────────
const SECTORES_MOCK: Sector[] = [
  { id: '1', nombre: 'BOCAGRANDE',         estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: '2', nombre: 'CASTILLOGRANDE',     estado: 'SIN_SERVICIO',     actualizadoEn: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: '3', nombre: 'EL LAGUITO',         estado: 'PRESION_BAJA',     actualizadoEn: new Date(Date.now() - 8 * 60_000).toISOString() },
  { id: '4', nombre: 'MANGA',              estado: 'CORTE_PROGRAMADO', actualizadoEn: new Date(Date.now() - 1 * 60_000).toISOString() },
  { id: '5', nombre: 'PIE DE LA POPA',     estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: '6', nombre: 'OLAYA ST. RICAURTE', estado: 'SIN_SERVICIO',     actualizadoEn: new Date(Date.now() - 3 * 60_000).toISOString() },
  { id: '7', nombre: 'OLAYA ST. CENTRAL',  estado: 'SIN_SERVICIO',     actualizadoEn: new Date(Date.now() - 3 * 60_000).toISOString() },
  { id: '8', nombre: 'GETSEMANI',          estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 6 * 60_000).toISOString() },
  { id: '9', nombre: 'EL CENTRO',          estado: 'PRESION_BAJA',     actualizadoEn: new Date(Date.now() - 20 * 60_000).toISOString() },
  { id: '10', nombre: 'LA BOQUILLA',       estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 4 * 60_000).toISOString() },
]

const PaginaMapa: FC = () => {
  const [_sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')
  const [contadorVecinos, setContadorVecinos] = useState(128)

  // Simular actualizaciones en tiempo real del contador de vecinos
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (Math.random() > 0.3) {
        setContadorVecinos(prev => prev + 1)
      }
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])

  // TODO Sprint 1: reemplazar con TanStack Query → GET /api/sectores (cuando C2 abra)
  const cargando = false
  const error = null
  const ultimaActualizacion = new Date(Date.now() - 3 * 60_000).toISOString()

  function alSeleccionarSector(sector: Sector) {
    setSectorActivo(sector)
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Mapa en vivo del servicio de agua en Cartagena">

      {/* Aviso de datos de demostración — se quita cuando C2 abra */}
      <div
        role="note"
        aria-label="Los datos mostrados son de demostración"
        style={{
          backgroundColor: 'var(--color-fondo)',
          borderBottom: '1px solid var(--color-linea)',
          padding: '0.4rem 1rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-util)',
          color: 'var(--color-tinta-2)',
          textAlign: 'center',
        }}
      >
        ⚠️ Datos de demostración — el mapa se conectará a la API real cuando el backend esté listo
      </div>

      {/* Layout Principal: Mapa y Lista siempre visibles (apilados en móvil, lado a lado en desktop) */}
      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6" style={{ height: 'calc(100dvh - 120px)', minHeight: '600px' }}>
        
        {/* Panel del mapa (Mitad de pantalla en Desktop, ventana flotante comprimida) */}
        <div
          id="panel-mapa"
          className="rounded-[2rem] panel-glass shadow-2xl relative flex-1"
          style={{ border: '1px solid var(--color-linea)', padding: '1rem', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, borderRadius: '1.25rem', overflow: 'hidden', position: 'relative' }}>
            <MapaCartagena
              sectores={SECTORES_MOCK}
              cargando={cargando}
              error={error}
              ultimaActualizacion={ultimaActualizacion}
              onSectorSeleccionado={alSeleccionarSector}
              onAbrirReporte={(id) => {
                setSectorReporte(id)
                setModalAbierto(true)
              }}
            />
          </div>
        </div>

        {/* Panel de lista (Mitad de pantalla en Desktop) */}
        <div
          id="panel-lista"
          className="rounded-[2rem] panel-glass shadow-xl flex flex-col overflow-hidden flex-1"
          style={{ border: '1px solid var(--color-linea)' }}
        >
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-linea)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: '800', color: 'var(--color-tinta)', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              ¿De nuevo sin agua?
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-tinta-2)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Sé un <strong style={{color: 'var(--color-acento)'}}>AguaVigía</strong>. Avísanos y ayudamos a que esto se solucione más rápido.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-tinta-3)', fontWeight: '600', backgroundColor: 'var(--color-superficie)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-estado-sin)', borderRadius: '50%', display: 'inline-block' }}></span>
                🔥 {contadorVecinos} vecinos reportaron esta semana
              </span>
              <button 
                onClick={() => {
                  setSectorReporte('')
                  setModalAbierto(true)
                }}
                className="hover-glowing"
                style={{ 
                  backgroundColor: 'var(--color-acento)', 
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff', 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: 'var(--radio-pill)', 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  transition: 'all var(--transicion)'
                }}
              >
                <Megaphone size={16} /> Reportar ahora
              </button>
            </div>
          </div>
          
          <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
            <ListaSectores
              sectores={SECTORES_MOCK}
              cargando={cargando}
              error={error}
              onSectorSeleccionado={alSeleccionarSector}
            />
          </div>
        </div>
      </div>

      {/* Apartado de Comentarios debajo del Mapa y Lista */}
      <div style={{ padding: '0 1.5rem 3rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <FeedComentarios />
      </div>

      <ModalReporte 
        abierto={modalAbierto} 
        alCerrar={() => setModalAbierto(false)} 
        sectorPreseleccionado={sectorReporte}
      />
    </main>
  )
}

export default PaginaMapa
