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
  // Leaflet no cancela de forma fiable un flyToBounds anterior al recibir otro durante la
  // animación. Detenerlo primero evita que dos selecciones rápidas compitan por el centro y zoom.
  mapa.stop()
  mapa.flyToBounds(bounds, opciones)
}
