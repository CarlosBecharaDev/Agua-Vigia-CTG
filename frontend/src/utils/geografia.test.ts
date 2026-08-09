import { describe, expect, it } from 'vitest'
import { geometriaContienePunto, nombresBarrioCoinciden, normalizarNombreBarrio, puntoDentroDeAnillo } from './geografia'

describe('geografía de barrios', () => {
  it('normaliza nombres con acentos y espacios', () => {
    expect(normalizarNombreBarrio('  La  Campiña ')).toBe('la campina')
    expect(nombresBarrioCoinciden('PABLO VI', 'PABLO VI - I')).toBe(true)
    expect(nombresBarrioCoinciden('NUEVO CHILE', 'CHILE')).toBe(false)
  })

  it('detecta puntos dentro y fuera de un polígono', () => {
    const anillo: [number, number][] = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]
    expect(puntoDentroDeAnillo([2, 2], anillo)).toBe(true)
    expect(puntoDentroDeAnillo([5, 2], anillo)).toBe(false)
    expect(puntoDentroDeAnillo([0, 2], anillo)).toBe(true)
  })

  it('acepta polígonos y multipolígonos GeoJSON', () => {
    const poligono = { type: 'Polygon', coordinates: [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]] }
    const multipoligono = {
      type: 'MultiPolygon',
      coordinates: [poligono.coordinates, [[[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]]]],
    }

    expect(geometriaContienePunto(poligono, 2, 2)).toBe(true)
    expect(geometriaContienePunto(multipoligono, 11, 11)).toBe(true)
    expect(geometriaContienePunto(multipoligono, 6, 6)).toBe(false)
  })
})
