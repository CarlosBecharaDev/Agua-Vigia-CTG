import type L from 'leaflet'

/** Evita que Leaflet lance fuera del ciclo de React cuando recibe límites con NaN. */
export function volarABounds(
  mapa: L.Map,
  bounds: L.LatLngBounds,
  opciones: L.FitBoundsOptions,
): void {
  if (!bounds.isValid()) {
    console.warn('Se descartó un flyToBounds con límites inválidos', bounds)
    return
  }
  mapa.flyToBounds(bounds, opciones)
}
