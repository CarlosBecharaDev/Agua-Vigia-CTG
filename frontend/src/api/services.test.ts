import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { cerrarCorteOficial, crearCorteOficial, crearReporte, listarCortesPorSector, listarReportesPendientes, moderarReporte, validarRespuestaSectores } from './services'

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

describe('operación del veedor', () => {
  it('rechaza una cola que no cumple el contrato OpenAPI', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [{ id: 'sin-sector' }] })
    await expect(listarReportesPendientes()).rejects.toThrow(/no cumplen el contrato/i)
  })

  it('usa las rutas exactas de moderación', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'r1' } })
    await moderarReporte('r1/con-espacio', 'aprobar')
    expect(patch).toHaveBeenCalledWith('/veedor/reportes/r1%2Fcon-espacio/aprobar')
  })

  it('consulta, registra y cierra cortes oficiales', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'c1' } })
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'c1', estado: 'CERRADO' } })
    const solicitud = { sectoresAfectados: ['manga'], inicio: '2026-08-09T10:00:00Z', finPrometido: '2026-08-09T12:00:00Z', causa: 'Mantenimiento' }

    await listarCortesPorSector('manga')
    await crearCorteOficial(solicitud)
    await cerrarCorteOficial('c1', '2026-08-09T11:30:00Z')

    expect(get).toHaveBeenCalledWith('/veedor/cortes', { params: { sectorId: 'manga' } })
    expect(post).toHaveBeenCalledWith('/veedor/cortes', solicitud)
    expect(patch).toHaveBeenCalledWith('/veedor/cortes/c1/cierre', { horaReal: '2026-08-09T11:30:00Z' })
  })
})
