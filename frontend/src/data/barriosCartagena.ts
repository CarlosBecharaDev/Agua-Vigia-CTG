/**
 * barriosCartagena.ts — único punto de carga del GeoJSON de barrios de Cartagena
 * (public/barrios-cartagena.geojson, de D5). Lo usan MapaCartagena (para dibujar los
 * polígonos), useDatosEnVivo (para saber qué barrios existen y armar la lista completa
 * de sectores) y acuacar.ts (para reconocer barrios mencionados en boletines). Un solo
 * fetch memoizado — si varios componentes lo piden, solo se descarga una vez por sesión.
 */

export interface FeatureBarrio {
  type: 'Feature'
  properties: { NOMBRE?: string; [clave: string]: unknown }
  geometry: unknown
}

export interface GeoJSONBarrios {
  type: 'FeatureCollection'
  features: FeatureBarrio[]
}

let promesaGeoJSON: Promise<GeoJSONBarrios> | null = null

export function obtenerGeoJSONBarrios(): Promise<GeoJSONBarrios> {
  if (!promesaGeoJSON) {
    promesaGeoJSON = fetch('/barrios-cartagena.geojson')
      .then((r) => r.json())
      .catch((error) => {
        promesaGeoJSON = null // permitir reintentar en la próxima llamada
        throw error
      })
  }
  return promesaGeoJSON
}

/** Nombres únicos de barrio, en orden alfabético — el mismo universo del que el mapa
 *  dibuja los polígonos, para que el buscador y la lista de sectores nunca se queden cortos. */
export async function obtenerBarriosCartagena(): Promise<string[]> {
  const geojson = await obtenerGeoJSONBarrios()
  const nombres = new Set<string>()
  for (const feature of geojson.features) {
    const nombre = feature.properties?.NOMBRE?.trim()
    if (nombre) nombres.add(nombre)
  }
  return Array.from(nombres).sort()
}
