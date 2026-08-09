import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { crearReporte, validarRespuestaSectores } from './services'

afterEach(() => vi.restoreAllMocks())

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

describe('reportes ciudadanos', () => {
  it('usa POST /reportes con el cuerpo tipado por OpenAPI', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'reporte-1' } })
    const solicitud = { sectorId: 'manga', tipo: 'SIN_AGUA', huella: 'hash-anonimo' }

    await expect(crearReporte(solicitud)).resolves.toEqual({ id: 'reporte-1' })
    expect(post).toHaveBeenCalledWith('/reportes', solicitud)
  })
})
