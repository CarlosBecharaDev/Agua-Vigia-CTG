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
import { useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { FeedComentarios } from '../components/FeedComentarios'
import { ModalReporte } from '../components/ModalReporte'
import type { Sector } from '../types/tipos-dominio'
import { Megaphone, CloudRain, Thermometer, RefreshCw, Database, ServerCrash, Droplet } from 'lucide-react'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'

const PaginaMapa: FC = () => {
  const {
    sectores,
    cargando,
    error,
    ultimaActualizacion,
    usandoDatosReales,
    clima,
    recargar,
  } = useDatosEnVivo();


  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')

  const alSeleccionarSector = useCallback((sector: Sector | null) => {
    setSectorActivo(sector)
  }, [])

  return (
    <main id="contenido-principal" role="main" aria-label="Mapa en vivo del servicio de agua en Cartagena">

      {/* Indicador de fuente de datos + clima */}
      <div
        role="note"
        style={{
          backgroundColor: 'var(--color-fondo)',
          borderBottom: '1px solid var(--color-linea)',
          padding: '0.4rem 1rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-util)',
          color: 'var(--color-tinta-2)',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Etiqueta de Estado de Conexión (Estilo Apple / Premium Pill) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-superficie)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {error ? (
            <>
              <ServerCrash size={14} color="var(--color-estado-sin)" />
              <span style={{ fontWeight: '500', color: 'var(--color-tinta)' }}>Sin conexión</span>
              <span style={{ color: 'var(--color-tinta-3)' }}>· Simulación</span>
            </>
          ) : sectores.some(s => s.id === '1') ? (
            <>
              <Database size={14} color="var(--color-estado-baja)" />
              <span style={{ fontWeight: '500', color: 'var(--color-tinta)' }}>Acuacar inactivo</span>
              <span style={{ color: 'var(--color-tinta-3)' }}>· Simulación</span>
            </>
          ) : (
            <>
              <div className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-estado-con)', borderRadius: '50%' }}></div>
              <span style={{ fontWeight: '500', color: 'var(--color-tinta)' }}>Datos en Vivo</span>
              <span style={{ color: 'var(--color-tinta-3)' }}>· Acuacar</span>
            </>
          )}
        </div>
        {clima && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: 'var(--color-superficie)', padding: '0.25rem 0.85rem', borderRadius: 'var(--radio-pill)', border: '1px solid var(--color-linea)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>{clima.icono}</span>
            <span style={{ fontWeight: '600', color: 'var(--color-tinta)', fontSize: '0.9rem' }}>{clima.temperatura}°C</span>
            <span style={{ color: 'var(--color-linea)' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-tinta-2)', fontWeight: '500', fontSize: '0.85rem' }}>
              <Droplet size={14} color="var(--color-acento)" /> {clima.humedad}%
            </span>
          </div>
        )}
        <button
          onClick={recargar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-acento)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}
          title="Actualizar datos"
        >
          <RefreshCw size={12} /> Actualizar
        </button>
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
                🔥 {sectores.filter(s => s.estado !== 'CON_SERVICIO').length} barrios reportan problemas
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
              sectores={sectores}
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
