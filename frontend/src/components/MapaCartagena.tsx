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
import { useEffect, useRef, useState } from 'react'
import type { FC } from 'react'
// (No se requiere Link aquí)
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { nombresBarrioCoinciden, normalizarNombreBarrio } from '../utils/geografia'
import { sectorDesdeGeojson } from '../utils/sectorGeojson'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { LocateFixed } from 'lucide-react'

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
}) => {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.GeoJSON | null>(null)
  const capaBaseRef = useRef<L.TileLayer | null>(null)
  const [mapaListo, setMapaListo] = useState(false)

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

    const mediaOscura = window.matchMedia('(prefers-color-scheme: dark)')
    const usarMapaOscuro = () => document.documentElement.dataset.theme === 'dark'
      || (!document.documentElement.dataset.theme && mediaOscura.matches)
    const actualizarCapaBase = () => {
      capaBaseRef.current?.remove()
      const oscuro = usarMapaOscuro()
      capaBaseRef.current = L.tileLayer(
        oscuro
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: oscuro
            ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'
            : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        },
      ).addTo(mapa)
    }
    actualizarCapaBase()

    const observarTema = new MutationObserver(actualizarCapaBase)
    observarTema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    mediaOscura.addEventListener('change', actualizarCapaBase)

    mapaRef.current = mapa
    return () => {
      observarTema.disconnect()
      mediaOscura.removeEventListener('change', actualizarCapaBase)
      mapa.remove()
      mapaRef.current = null
      capaBaseRef.current = null
    }
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
            layer.on('click', () => {
              const sector = buscarSector(indiceSectores.current, nombre)
              const sectorClick = sectorDesdeGeojson(nombre, sector)
              
              onSectorSeleccionadoRef.current?.(sectorClick)
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
        setMapaListo(true)
      })
      .catch(() => setMapaListo(true))

    return () => { montado = false; }
  }, [])

  return (
    <div className="mapa-shell">
      <div className="mapa-status" role="status" aria-live="polite">
        <span className={`mapa-status-punto${cargando ? ' actualizando' : ''}`} />
        {cargando && (
          <span>Cargando sectores…</span>
        )}
        {error && sectores.length === 0 && (
          <span>No pudimos cargar los sectores</span>
        )}
        {!cargando && !error && (
          <span>
            {sectores.length > 0
              ? `${sectores.filter(s => s.estado === 'SIN_SERVICIO').length} sectores sin servicio`
              : 'Toca tu barrio en el mapa'}
          </span>
        )}
      </div>

      <div
        ref={contenedorRef}
        id="contenedor-mapa"
        role="region"
        aria-label="Mapa interactivo de sectores de Cartagena con estado del servicio de agua"
        className="mapa-lienzo"
      />
      <div className="mapa-pie"><span><LocateFixed size={14} /> Cartagena de Indias</span><EtiquetaFrescura timestampIso={ultimaActualizacion} /></div>

      {/* Overlay de carga con skeleton */}
      {(cargando || !mapaListo) && <div className="mapa-cargando" aria-hidden="true"><div className="skeleton mapa-skeleton" /></div>}
    </div>
  )
}
