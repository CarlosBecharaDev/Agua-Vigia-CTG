import { describe, expect, it } from 'vitest'
import { sectorDesdeGeojson } from '../utils/sectorGeojson'

describe('sectorDesdeGeojson', () => {
  it('mantiene como desconocido un polígono ausente del backend', () => {
    expect(sectorDesdeGeojson('BARRIO SIN CONTRATO')).toMatchObject({
      nombre: 'BARRIO SIN CONTRATO',
      estado: null,
      actualizadoEn: null,
    })
  })
})
