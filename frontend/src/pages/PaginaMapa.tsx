/**
 * PaginaMapa — M1 (Mapa en vivo) + lista accesible (RF004).
 *
 * Sprint 1: usa datos mock locales hasta que C2 abra y se pueda
 * conectar GET /api/sectores. Los tipos, colores y componentes
 * son definitivos — solo la fuente de datos cambiará.
 *
 * DESIGN.md §1: responde "¿tengo agua?" en menos de 5 segundos.
 */
import { useState } from 'react'
import type { FC } from 'react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import type { Sector } from '../types/tipos-dominio'

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

// Vista del mapa en pantallas pequeñas
type VistaMovil = 'mapa' | 'lista'

const PaginaMapa: FC = () => {
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('mapa')
  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)

  // TODO Sprint 1: reemplazar con TanStack Query → GET /api/sectores (cuando C2 abra)
  const cargando = false
  const error = null
  const ultimaActualizacion = new Date(Date.now() - 3 * 60_000).toISOString()

  function alSeleccionarSector(sector: Sector) {
    setSectorActivo(sector)
    // En móvil, al tocar un sector de la lista, lleva al mapa
    if (vistaMovil === 'lista') setVistaMovil('mapa')
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

      {/* Selector de vista móvil — Mapa / Lista */}
      <div
        role="tablist"
        aria-label="Ver como mapa o como lista"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-linea)',
          backgroundColor: 'var(--color-superficie)',
        }}
      >
        {(['mapa', 'lista'] as VistaMovil[]).map((vista) => (
          <button
            key={vista}
            role="tab"
            aria-selected={vistaMovil === vista}
            id={`tab-${vista}`}
            aria-controls={`panel-${vista}`}
            onClick={() => setVistaMovil(vista)}
            style={{
              flex: 1,
              border: 'none',
              borderBottom: vistaMovil === vista ? '2px solid var(--color-acento)' : '2px solid transparent',
              background: 'none',
              color: vistaMovil === vista ? 'var(--color-acento)' : 'var(--color-tinta-2)',
              fontFamily: 'var(--font-cuerpo)',
              fontSize: '0.875rem',
              fontWeight: vistaMovil === vista ? '600' : '400',
              padding: '0.75rem',
              cursor: 'pointer',
              minHeight: '44px',
              transition: 'color var(--transicion), border-color var(--transicion)',
            }}
          >
            {vista === 'mapa' ? '🗺️ Mapa' : '📋 Lista'}
          </button>
        ))}
      </div>

      {/* Panel del mapa */}
      <div
        id="panel-mapa"
        role="tabpanel"
        aria-labelledby="tab-mapa"
        hidden={vistaMovil !== 'mapa'}
        style={{ height: 'calc(100dvh - 160px)' }}
      >
        <MapaCartagena
          sectores={SECTORES_MOCK}
          cargando={cargando}
          error={error}
          ultimaActualizacion={ultimaActualizacion}
          onSectorSeleccionado={alSeleccionarSector}
        />
      </div>

      {/* Panel de lista — alternativa accesible RF004 */}
      <div
        id="panel-lista"
        role="tabpanel"
        aria-labelledby="tab-lista"
        hidden={vistaMovil !== 'lista'}
        style={{ padding: '1rem', overflowY: 'auto', maxHeight: 'calc(100dvh - 160px)' }}
      >
        <ListaSectores
          sectores={SECTORES_MOCK}
          cargando={cargando}
          error={error}
          onSectorSeleccionado={alSeleccionarSector}
        />
      </div>
    </main>
  )
}

export default PaginaMapa
