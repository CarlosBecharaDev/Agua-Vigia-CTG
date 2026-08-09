/**
 * MapaCartagena — componente principal del mapa (M1).
 *
 * Sprint 1: carga el GeoJSON de barrios desde /data/geoespacial/barrios-cartagena.geojson
 * (datos reales de D5) y colorea los polígonos según su estado.
 *
 * C2 ya está abierta: el estado de cada sector viene de GET /api/sectores
 * (vía useDatosEnVivo), no de datos locales. Los tipos y colores son definitivos.
 *
 * Leaflet requiere que su CSS se importe antes de crear el mapa.
 */
import { useEffect, useRef } from 'react'
import type { FC } from 'react'
// (No se requiere Link aquí)
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { nombresBarrioCoinciden, normalizarNombreBarrio } from '../utils/geografia'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { InsigniaEstado } from './InsigniaEstado'

// Cartagena de Indias — centro, límites y zoom inicial
const CENTRO: L.LatLngExpression = [10.3950, -75.4800]
const ZOOM_INICIAL = 13
const BOUNDS_CARTAGENA: L.LatLngBoundsExpression = [
  [10.25, -75.68], // Suroeste (Expandido más al sur y al oeste para que no se corte Cartagena)
  [10.48, -75.35]  // Noreste (Expandido un poco para dar más margen)
]

interface Props {
  sectores: Sector[]
  cargando: boolean
  error: string | null
  ultimaActualizacion: string | null
  sectorActivo: Sector | null
  onSectorSeleccionado?: (sector: Sector | null) => void
  onAbrirReporte?: (sectorId: string) => void
}

/** Convierte el NOMBRE del GeoJSON al id del sector para hacer lookup */
function normalizarNombre(nombre: string): string {
  return normalizarNombreBarrio(nombre)
}

function buscarSector(indice: Map<string, Sector>, nombre: string): Sector | undefined {
  const nombreNormalizado = normalizarNombre(nombre)
  return indice.get(nombreNormalizado)
    ?? [...indice.entries()].find(([clave]) => nombresBarrioCoinciden(clave, nombreNormalizado))?.[1]
}

export const MapaCartagena: FC<Props> = ({
  sectores,
  cargando,
  error,
  ultimaActualizacion,
  sectorActivo,
  onSectorSeleccionado,
  onAbrirReporte
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.GeoJSON | null>(null)

  // Índice de sectores por nombre normalizado para lookup O(1)
  const indiceSectores = useRef<Map<string, Sector>>(new Map())
  useEffect(() => {
    const mapa = new Map<string, Sector>()
    sectores.forEach(s => mapa.set(normalizarNombre(s.nombre), s))
    indiceSectores.current = mapa
  }, [sectores])

  // Ref para tener siempre el último valor en cierres (closures) asíncronos
  const sectorActivoRef = useRef(sectorActivo)
  useEffect(() => {
    sectorActivoRef.current = sectorActivo
  }, [sectorActivo])

  // Actualizar estilos dinámicamente cuando el usuario selecciona un barrio
  useEffect(() => {
    if (!capaRef.current) return

    capaRef.current.setStyle((feature) => {
      const nombre = feature?.properties?.NOMBRE ?? ''
      const sector = buscarSector(indiceSectores.current, nombre)
      
      let color = COLOR_SIN_DATOS.claro;
      if (sector) {
        color = sector.estado ? COLOR_POR_ESTADO[sector.estado].claro : COLOR_SIN_DATOS.claro;
      }
      
      const esActivo = sectorActivo && sector && sectorActivo.id === sector.id

      return {
        fillColor: color,
        fillOpacity: sector ? (esActivo ? 0.85 : (sector.estado ? 0.55 : 0.3)) : 0.15,
        color: '#ffffff',
        weight: esActivo ? 2 : 1,
        opacity: esActivo ? 1 : 0.7,
        className: esActivo ? 'barrio-seleccionado' : ''
      }
    })

    // Centrar automáticamente el mapa en el polígono del barrio seleccionado
    if (sectorActivo) {
      capaRef.current.eachLayer((layer: any) => {
        const nombre = layer.feature?.properties?.NOMBRE ?? ''
        const sector = buscarSector(indiceSectores.current, nombre)
        if (sector && sector.id === sectorActivo.id && mapaRef.current) {
          mapaRef.current.flyToBounds(layer.getBounds(), { padding: [20, 20], duration: 1.5 })
        }
      })
    }
  }, [sectorActivo, sectores])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const mapa = L.map(contenedorRef.current, {
      center: CENTRO,
      zoom: ZOOM_INICIAL,
      minZoom: 12,
      maxBounds: BOUNDS_CARTAGENA,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapa)

    mapaRef.current = mapa
    return () => { mapa.remove(); mapaRef.current = null }
  }, [])

  // Cargar GeoJSON y colorear polígonos
  const onSectorSeleccionadoRef = useRef(onSectorSeleccionado)
  useEffect(() => {
    onSectorSeleccionadoRef.current = onSectorSeleccionado
  }, [onSectorSeleccionado])

  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return

    let montado = true;

    if (capaRef.current) { capaRef.current.remove(); capaRef.current = null }

    fetch('/barrios-cartagena.geojson')
      .then(r => r.json())
      .then((geojson) => {
        if (!montado) return;
        const capa = L.geoJSON(geojson, {
          style: (feature) => {
            const nombre = feature?.properties?.NOMBRE ?? ''
            const sector = buscarSector(indiceSectores.current, nombre)
            const color = sector?.estado
              ? COLOR_POR_ESTADO[sector.estado].claro
              : COLOR_SIN_DATOS.claro
            const esActivo = sectorActivoRef.current && sector && sectorActivoRef.current.id === sector.id

            return {
              fillColor: color,
              fillOpacity: sector ? (esActivo ? 0.85 : 0.55) : 0.15,
              color: '#ffffff',
              weight: esActivo ? 2 : 1,
              opacity: esActivo ? 1 : 0.7,
              className: esActivo ? 'barrio-seleccionado' : ''
            }
          },
          onEachFeature: (feature, layer) => {
            const nombre = feature?.properties?.NOMBRE ?? 'Sector desconocido'
            // Tooltip con nombre siempre visible
            layer.bindTooltip(nombre, { sticky: true, className: 'leaflet-tooltip-av' })

            layer.on('click', () => {
              const sector = buscarSector(indiceSectores.current, nombre)
              // Si el barrio no está en la BD, lo generamos al vuelo como CON_SERVICIO
              const sectorClick = sector || {
                id: `geo-${normalizarNombre(nombre)}`,
                nombre: nombre,
                estado: null,
                reportesActivos: 0,
                actualizadoHace: 'En este momento',
                actualizadoEn: new Date().toISOString()
              };
              
              onSectorSeleccionadoRef.current?.(sectorClick as Sector)
            })

            layer.on('mouseover', (e) => {
              const l = e.target as L.Path
              l.setStyle({ weight: 2, fillOpacity: 0.75 })
            })
            layer.on('mouseout', (e) => {
              capa.resetStyle(e.target)
            })
          },
        }).addTo(mapa)

        capaRef.current = capa
      })
      .catch(console.error)

    return () => { montado = false; }
  }, [])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Barra de estado superior — responde "¿tengo agua?" en < 5 s (DESIGN.md §1) */}
      <div
        className="panel-glass"
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          borderRadius: 'var(--radio-pill)',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: 'calc(100vw - 4rem)',
        }}
      >
        {cargando && (
          <span style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem', fontFamily: 'var(--font-util)' }}>
            Cargando sectores…
          </span>
        )}
        {error && sectores.length === 0 && (
          <span style={{ color: 'var(--color-estado-sin)', fontSize: '0.85rem', fontFamily: 'var(--font-util)' }}>
            No pudimos cargar los sectores. Revisa tu conexión.
          </span>
        )}
        {!cargando && !error && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-tinta)', fontFamily: 'var(--font-util)' }}>
            {sectores.length > 0
              ? `${sectores.filter(s => s.estado === 'SIN_SERVICIO').length} sectores sin servicio`
              : 'Toca tu barrio en el mapa'}
          </span>
        )}
      </div>

      {/* Contenedor del mapa */}
      <div
        ref={contenedorRef}
        id="contenedor-mapa"
        role="img"
        aria-label="Mapa interactivo de sectores de Cartagena con estado del servicio de agua"
        style={{ height: 'calc(100% - 36px)', width: '100%' }}
      />

      {/* Pie del mapa con la frescura de datos */}
      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-fondo)', borderTop: '1px solid var(--color-linea)' }}>
        <EtiquetaFrescura timestampIso={ultimaActualizacion} />
      </div>

      {/* Panel de detalle del sector seleccionado */}
      {sectorActivo && (
        <div
          role="dialog"
          aria-label={`Detalle del sector ${sectorActivo.nombre}`}
          className="panel-glass"
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            borderRadius: 'var(--radio-lg)',
            padding: '1rem 1.25rem',
            minWidth: '260px',
            maxWidth: 'calc(100vw - 3rem)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                {sectorActivo.nombre}
              </p>
              <InsigniaEstado estado={sectorActivo.estado} />
            </div>
            <button
              aria-label="Cerrar detalle del sector"
              onClick={() => onSectorSeleccionado?.(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-tinta-3)',
                fontSize: '1.2rem',
                padding: '0.25rem',
                minHeight: '44px',
                minWidth: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <EtiquetaFrescura timestampIso={sectorActivo.actualizadoEn} />
            <button
              onClick={() => onAbrirReporte?.(sectorActivo.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--color-acento)',
                textDecoration: 'underline',
                fontFamily: 'var(--font-util)',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '0'
              }}
            >
              Reportar problema en este sector →
            </button>
          </div>
        </div>
      )}

      {/* Overlay de carga con skeleton */}
      {cargando && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'var(--color-fondo)',
            opacity: 0.7,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: 'var(--radio-lg)' }} />
        </div>
      )}
    </div>
  )
}
