import L from 'leaflet'
import { describe, expect, it, vi } from 'vitest'
import { sectorDesdeGeojson } from '../utils/sectorGeojson'
import { volarABounds } from '../utils/mapaLeaflet'
import { observarEstadoCapaBase } from '../utils/estadoCapaBase'

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
    const mapa = { flyToBounds: vi.fn() } as unknown as L.Map
    const bounds = L.latLngBounds([10.39, -75.48], [10.40, -75.47])

    volarABounds(mapa, bounds, { padding: [20, 20] })

    expect(mapa.flyToBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] })
  })

  it('descarta el vuelo sin lanzar cuando los límites traen NaN — bug real: "Invalid LatLng object" tumbaba toda la vista', () => {
    const mapa = { flyToBounds: vi.fn() } as unknown as L.Map
    // Un LatLngBounds vacío (sin ningún .extend()) es exactamente el caso que Leaflet
    // reportaba como inválido en el crash original.
    const bounds = L.latLngBounds([])

    expect(() => volarABounds(mapa, bounds, { padding: [20, 20] })).not.toThrow()
    expect(mapa.flyToBounds).not.toHaveBeenCalled()
  })
})

describe('observarEstadoCapaBase', () => {
  it('conserva el aviso de teselas fallidas al completar la tanda y se recupera en la siguiente', () => {
    const capa = L.tileLayer('https://example.test/{z}/{x}/{y}.png')
    const cambios: string[] = []
    const dejarDeObservar = observarEstadoCapaBase(capa, (estado) => cambios.push(estado))

    capa.fire('loading')
    capa.fire('tileerror')
    capa.fire('load')
    expect(cambios).toEqual(['cargando', 'no-disponible', 'no-disponible'])

    capa.fire('loading')
    capa.fire('load')
    expect(cambios.at(-1)).toBe('disponible')

    dejarDeObservar()
    capa.fire('tileerror')
    expect(cambios.at(-1)).toBe('disponible')
  })
})
