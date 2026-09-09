import L from 'leaflet'
import { describe, expect, it, vi } from 'vitest'
import { sectorDesdeGeojson } from '../utils/sectorGeojson'
import { volarABounds } from '../utils/mapaLeaflet'

describe('sectorDesdeGeojson', () => {
  it('mantiene como desconocido un polígono ausente del backend', () => {
    expect(sectorDesdeGeojson('BARRIO SIN CONTRATO')).toMatchObject({
      nombre: 'BARRIO SIN CONTRATO',
      estado: null,
      actualizadoEn: null,
    })
  })
})

describe('volarABounds', () => {
  it('llama a flyToBounds cuando los límites son válidos', () => {
    const mapa = { stop: vi.fn(), flyToBounds: vi.fn() } as unknown as L.Map
    const bounds = L.latLngBounds([10.39, -75.48], [10.40, -75.47])

    volarABounds(mapa, bounds, { padding: [20, 20] })

    expect(mapa.stop).toHaveBeenCalledOnce()
    expect(mapa.flyToBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] })
  })

  it('descarta el vuelo sin lanzar cuando los límites traen NaN — bug real: "Invalid LatLng object" tumbaba toda la vista', () => {
    const mapa = { stop: vi.fn(), flyToBounds: vi.fn() } as unknown as L.Map
    // Un LatLngBounds vacío (sin ningún .extend()) es exactamente el caso que Leaflet
    // reportaba como inválido en el crash original.
    const bounds = L.latLngBounds([])

    expect(() => volarABounds(mapa, bounds, { padding: [20, 20] })).not.toThrow()
    expect(mapa.stop).not.toHaveBeenCalled()
    expect(mapa.flyToBounds).not.toHaveBeenCalled()
  })

  it('cancela el vuelo anterior antes de cada selección rápida', () => {
    const orden: string[] = []
    const mapa = {
      stop: vi.fn(() => { orden.push('stop') }),
      flyToBounds: vi.fn(() => { orden.push('fly') }),
    } as unknown as L.Map
    const primero = L.latLngBounds([10.39, -75.48], [10.40, -75.47])
    const segundo = L.latLngBounds([10.41, -75.51], [10.42, -75.50])

    volarABounds(mapa, primero, { duration: 0.85 })
    volarABounds(mapa, segundo, { duration: 0.85 })

    expect(orden).toEqual(['stop', 'fly', 'stop', 'fly'])
  })
})
