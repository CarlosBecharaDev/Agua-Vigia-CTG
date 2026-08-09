import { describe, expect, it } from 'vitest'
import { validarRespuestaSectores } from './services'

describe('contrato de sectores', () => {
  it('acepta estado nulo sin convertirlo en servicio normal', () => {
    const resultado = validarRespuestaSectores({
      generadoEn: '2026-08-09T10:00:00Z',
      sectores: [{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }],
    })
    expect(resultado.sectores[0].estado).toBeNull()
  })

  it('rechaza una respuesta que no cumple OpenAPI', () => {
    expect(() => validarRespuestaSectores({ sectores: [{ nombre: 'MANGA' }] })).toThrow(/respuesta de sectores inválida/i)
  })
})
