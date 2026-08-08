/**
 * MapaCartagena — componente principal del mapa (M1).
 *
 * Sprint 1: carga el GeoJSON de barrios desde /data/geoespacial/barrios-cartagena.geojson
 * (datos reales de D5) y colorea los polígonos según su estado.
 *
 * Sin C2: los estados son mock locales que se reemplazarán con GET /api/sectores
 * cuando D3 publique el contrato OpenAPI. Los tipos y colores son definitivos.
 *
 * Leaflet requiere que su CSS se importe antes de crear el mapa.
 */
import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { InsigniaEstado } from './InsigniaEstado'

// Cartagena de Indias — centro y zoom inicial
const CENTRO: L.LatLngExpression = [10.3910, -75.4794]
const ZOOM_INICIAL = 12

interface Props {
  sectores: Sector[]
  cargando: boolean
  error: string | null
  ultimaActualizacion: string | null
  onSectorSeleccionado?: (sector: Sector) => void
}

/** Convierte el NOMBRE del GeoJSON al id del sector para hacer lookup */
function normalizarNombre(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export const MapaCartagena: FC<Props> = ({
  sectores,
  cargando,
  error,
  ultimaActualizacion,
  onSectorSeleccionado,
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.GeoJSON | null>(null)
  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)

  // Índice de sectores por nombre normalizado para lookup O(1)
  const indiceSectores = useRef<Map<string, Sector>>(new Map())
  useEffect(() => {
    const mapa = new Map<string, Sector>()
    sectores.forEach(s => mapa.set(normalizarNombre(s.nombre), s))
    indiceSectores.current = mapa
  }, [sectores])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const mapa = L.map(contenedorRef.current, {
      center: CENTRO,
      zoom: ZOOM_INICIAL,
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
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return

    if (capaRef.current) { capaRef.current.remove(); capaRef.current = null }

    fetch('/barrios-cartagena.geojson')
      .then(r => r.json())
      .then((geojson) => {
        const capa = L.geoJSON(geojson, {
          style: (feature) => {
            const nombre = feature?.properties?.NOMBRE ?? ''
            const sector = indiceSectores.current.get(normalizarNombre(nombre))
            const estado: EstadoServicio = sector?.estado ?? 'CON_SERVICIO'
            // Usamos claro por defecto; el tema oscuro se aplica vía CSS en el contenedor
            const color = COLOR_POR_ESTADO[estado].claro

            return {
              fillColor: color,
              fillOpacity: sector ? 0.55 : 0.15,
              color: '#fff',
              weight: 1,
              opacity: 0.7,
            }
          },
          onEachFeature: (feature, layer) => {
            const nombre = feature?.properties?.NOMBRE ?? 'Sector desconocido'
            const sector = indiceSectores.current.get(normalizarNombre(nombre))

            // Tooltip con nombre siempre visible
            layer.bindTooltip(nombre, { sticky: true, className: 'leaflet-tooltip-av' })

            layer.on('click', () => {
              if (sector) {
                setSectorActivo(sector)
                onSectorSeleccionado?.(sector)
              }
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
  }, [sectores, onSectorSeleccionado])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* Barra de estado superior — responde "¿tengo agua?" en < 5 s (DESIGN.md §1) */}
      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'var(--color-superficie)',
          border: '1px solid var(--color-linea)',
          borderRadius: 'var(--radio-lg)',
          padding: '0.4rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          maxWidth: 'calc(100vw - 4rem)',
        }}
      >
        {cargando && (
          <span style={{ color: 'var(--color-tinta-2)', fontSize: '0.85rem', fontFamily: 'var(--font-util)' }}>
            Cargando sectores…
          </span>
        )}
        {error && (
          <span style={{ color: 'var(--color-estado-sin)', fontSize: '0.85rem', fontFamily: 'var(--font-util)' }}>
            No pudimos cargar los sectores. Revisa tu conexión.
          </span>
        )}
        {!cargando && !error && (
          <>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-tinta)', fontFamily: 'var(--font-util)' }}>
              {sectores.length > 0
                ? `${sectores.filter(s => s.estado === 'SIN_SERVICIO').length} sectores sin servicio`
                : 'Toca tu barrio en el mapa'}
            </span>
            <EtiquetaFrescura timestampIso={ultimaActualizacion} />
          </>
        )}
      </div>

      {/* Contenedor del mapa */}
      <div
        ref={contenedorRef}
        id="contenedor-mapa"
        role="img"
        aria-label="Mapa interactivo de sectores de Cartagena con estado del servicio de agua"
        style={{ height: '100%', width: '100%' }}
      />

      {/* Panel de detalle del sector seleccionado */}
      {sectorActivo && (
        <div
          role="dialog"
          aria-label={`Detalle del sector ${sectorActivo.nombre}`}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'var(--color-superficie)',
            border: '1px solid var(--color-linea)',
            borderRadius: 'var(--radio-lg)',
            padding: '1rem 1.25rem',
            minWidth: '260px',
            maxWidth: 'calc(100vw - 3rem)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
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
              onClick={() => setSectorActivo(null)}
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
            <a
              href="/reportar"
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-acento)',
                textDecoration: 'underline',
                fontFamily: 'var(--font-util)',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '44px',
              }}
            >
              Reportar problema en este sector →
            </a>
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
