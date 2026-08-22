/** Ubicación automática para el paso 3 del formulario de suscripción: pide la coordenada
 *  del navegador y la cruza contra el GeoJSON de barrios (mismo polígono que dibuja el
 *  mapa) para asumir el sector del vecino, sin pedirle que lo busque en una lista. */
import { obtenerGeoJSONBarrios } from '../data/barriosCartagena'
import { geometriaContienePunto, nombresBarrioCoinciden } from './geografia'

export function obtenerCoordenadaDelNavegador(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no permite compartir la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(coords),
      () => reject(new Error('No pudimos obtener tu ubicación. Elige tu barrio manualmente.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

/** Devuelve el nombre del barrio (según el GeoJSON) cuyo polígono contiene la coordenada. */
export async function detectarBarrioPorCoordenada(latitud: number, longitud: number): Promise<string | null> {
  const geojson = await obtenerGeoJSONBarrios()
  const feature = geojson.features.find((candidato) =>
    geometriaContienePunto(candidato.geometry as { type?: string; coordinates?: unknown }, latitud, longitud),
  )
  return feature?.properties?.NOMBRE?.trim() || null
}

/** Empareja el nombre de barrio detectado con un sector real de la lista que maneja la página. */
export function emparejarSectorPorNombreBarrio<T extends { nombre: string }>(
  sectores: T[],
  nombreBarrio: string,
): T | null {
  return sectores.find((sector) => nombresBarrioCoinciden(sector.nombre, nombreBarrio)) ?? null
}
