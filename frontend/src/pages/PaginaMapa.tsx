/**
 * PaginaMapa — M1 (Mapa en vivo) + lista accesible (RF004).
 *
 * Conectado a datos reales vía useDatosEnVivo:
 *  - Acuacar WordPress API → boletines oficiales → estado de barrios
 *  - Open-Meteo → clima en tiempo real
 *  - Fallback automático a datos mock si las APIs no responden.
 *
 * DESIGN.md §1: responde "¿tengo agua?" en menos de 5 segundos.
 */
import { useState, useCallback } from 'react'
import type { FC } from 'react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { ModalReporte } from '../components/ModalReporte'
import type { Sector } from '../types/tipos-dominio'
import { Megaphone, RefreshCw, Database, ServerCrash, Droplet, Search, Mail } from 'lucide-react'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'

const PaginaMapa: FC = () => {
  const { sectores, clima, cargando, error, ultimaActualizacion, usandoDatosReales, recargar } = useDatosEnVivo();

  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')

  const sectoresFiltrados = sectores.filter(s => s.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  const alSeleccionarSector = useCallback((sector: Sector | null) => {
    setSectorActivo(sector)
  }, [])

  return (
    <main id="contenido-principal" role="main" aria-label="Mapa en vivo del servicio de agua en Cartagena">
      {/* Layout Principal: Mapa y Lista siempre visibles (apilados en móvil, lado a lado en desktop) */}
      <div className="map-workspace">
        
        {/* Panel del mapa (Mitad de pantalla en Desktop, ventana flotante comprimida) */}
        <div
          id="panel-mapa"
          className="map-card"
        >
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', border: 'none', outline: 'none' }}>
            <MapaCartagena
              sectores={sectores}
              cargando={cargando}
              error={error}
              ultimaActualizacion={ultimaActualizacion}
              sectorActivo={sectorActivo}
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
          className="sector-panel"
        >
          <div className="sector-panel-heading">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: '800', color: 'var(--color-tinta)', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
              ¿No hay agua en tu barrio?
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-tinta-2)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Sé un <strong style={{color: 'var(--color-acento)'}}>AguaVigía</strong>. Avísanos y ayudamos a que esto se solucione más rápido.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>

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
            
            {/* Buscador de barrios transparente */}
            <div style={{ marginTop: '1.25rem', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-tinta-3)' }}>
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Busca tu barrio..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  borderRadius: 'var(--radio-md)',
                  border: '1px solid var(--color-linea)',
                  backgroundColor: 'var(--color-fondo)',
                  color: 'var(--color-tinta)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all var(--transicion)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-acento)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-linea)'}
              />
            </div>

          </div>
          
          <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
            <ListaSectores
              sectores={sectoresFiltrados}
              cargando={cargando}
              error={error}
              onSectorSeleccionado={alSeleccionarSector}
            />
          </div>
        </div>
      </div>

      <ModalReporte
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        sectores={sectores}
        sectorPreseleccionado={sectorReporte}
      />
    </main>
  )
}

export default PaginaMapa
