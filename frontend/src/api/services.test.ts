import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import {
  agregarEvidenciaReporte,
  cerrarCorteOficial,
  confirmarReporte,
  crearCorteOficial,
  crearReporte,
  listarCortesPorSector,
  listarPropuestasIngesta,
  listarReportesPendientes,
  moderarReporte,
  obtenerCorte,
  obtenerIndiceCumplimientoPorCorte,
  obtenerIndiceCumplimientoPorSector,
  obtenerSector,
  registrarReporteCiudadano,
  urlExportarCumplimientoCsv,
  urlExportarEstadisticasCsv,
  validarRespuestaSectores,
} from './services'

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

  it('permite reportar desde el mapa con una huella anónima', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'reporte-2' } })

    await registrarReporteCiudadano('manga', 'PRESION_BAJA')

    expect(post).toHaveBeenCalledWith('/reportes', expect.objectContaining({
      sectorId: 'manga',
      tipo: 'PRESION_BAJA',
      huella: expect.any(String),
    }))
  })
})

describe('evidencia y confirmación de reportes (M10/M11)', () => {
  it('sube la foto como multipart al reporte indicado', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'reporte-1', fotoUrl: '/fotos/x.jpg' } })
    const foto = new File(['contenido'], 'evidencia.jpg', { type: 'image/jpeg' })

    await agregarEvidenciaReporte('reporte-1', foto)

    expect(post).toHaveBeenCalledWith(
      '/reportes/reporte-1/foto',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )
    const cuerpo = post.mock.calls[0][1] as FormData
    expect(cuerpo.get('foto')).toBe(foto)
  })

  it('confirma un reporte ajeno con una huella anónima', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'reporte-1', confirmaciones: 1 } })

    await confirmarReporte('reporte-1')

    expect(post).toHaveBeenCalledWith('/reportes/reporte-1/confirmar', {
      huella: expect.any(String),
    })
  })
})

describe('cumplimiento por sector y exportación CSV (M6/RF025)', () => {
  it('consulta el índice de un sector por su id', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { sectorId: 'manga', porcentajeCumplimiento: 87 } })

    await expect(obtenerIndiceCumplimientoPorSector('manga')).resolves.toEqual({ sectorId: 'manga', porcentajeCumplimiento: 87 })
    expect(get).toHaveBeenCalledWith('/cumplimiento/sectores/manga')
  })

  it('arma las URLs de descarga con la base de la API', () => {
    expect(urlExportarEstadisticasCsv()).toBe(`${apiClient.defaults.baseURL}/estadisticas/exportar.csv`)
    expect(urlExportarCumplimientoCsv()).toBe(`${apiClient.defaults.baseURL}/cumplimiento/serie.csv`)
    expect(urlExportarCumplimientoCsv('manga')).toBe(`${apiClient.defaults.baseURL}/cumplimiento/serie.csv?sectorId=manga`)
  })
})

describe('detalle de sector y de corte (enlaces de correo y panel del veedor)', () => {
  it('consulta el detalle de un sector por su id', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { id: 'manga', nombre: 'MANGA', estado: 'SIN_SERVICIO', actualizadoEn: '2026-08-09T10:00:00Z' },
    })

    await expect(obtenerSector('manga')).resolves.toEqual({
      id: 'manga', nombre: 'MANGA', estado: 'SIN_SERVICIO', actualizadoEn: '2026-08-09T10:00:00Z',
    })
    expect(get).toHaveBeenCalledWith('/sectores/manga')
  })

  it('rechaza un sector que no cumple el contrato OpenAPI', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { nombre: 'MANGA' } })
    await expect(obtenerSector('manga')).rejects.toThrow(/sector inválido/i)
  })

  it('consulta el detalle de un corte por su id', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { id: 'c1', estado: 'RESTABLECIDO' } })

    await expect(obtenerCorte('c1')).resolves.toEqual({ id: 'c1', estado: 'RESTABLECIDO' })
    expect(get).toHaveBeenCalledWith('/veedor/cortes/c1')
  })

  it('consulta el índice de cumplimiento de un corte puntual', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { porcentajeCumplimiento: 100 } })

    await expect(obtenerIndiceCumplimientoPorCorte('c1')).resolves.toEqual({ porcentajeCumplimiento: 100 })
    expect(get).toHaveBeenCalledWith('/cumplimiento/cortes/c1')
  })
})

describe('operación del veedor', () => {
  it('rechaza una cola que no cumple el contrato OpenAPI', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [{ id: 'sin-sector' }] })
    await expect(listarReportesPendientes()).rejects.toThrow(/no cumplen el contrato/i)
  })

  it('pide la cola de moderación completa y expone el total real del servidor', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [{ id: 'r1', sectorId: 'manga', tipo: 'SIN_AGUA', timestamp: '2026-08-09T10:00:00Z', estadoModeracion: 'PENDIENTE' }],
      headers: { 'x-total-count': '3' },
    })

    await expect(listarReportesPendientes()).resolves.toEqual({
      items: [{ id: 'r1', sectorId: 'manga', tipo: 'SIN_AGUA', timestamp: '2026-08-09T10:00:00Z', estadoModeracion: 'PENDIENTE' }],
      totalCount: 3,
    })
    expect(get).toHaveBeenCalledWith('/veedor/reportes/pendientes', { params: { tamano: 200 } })
  })

  it('usa items.length como total si el servidor no manda X-Total-Count', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], headers: {} })
    await expect(listarReportesPendientes()).resolves.toEqual({ items: [], totalCount: 0 })
  })

  it('usa las rutas exactas de moderación', async () => {
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'r1' } })
    await moderarReporte('r1/con-espacio', 'aprobar')
    expect(patch).toHaveBeenCalledWith('/veedor/reportes/r1%2Fcon-espacio/aprobar')
  })

  it('consulta, registra y cierra cortes oficiales', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] })
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'c1' } })
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { id: 'c1', estado: 'RESTABLECIDO' } })
    const solicitud = { sectoresAfectados: ['manga'], inicio: '2026-08-09T10:00:00Z', finPrometido: '2026-08-09T12:00:00Z', causa: 'Mantenimiento' }

    await listarCortesPorSector('manga')
    await crearCorteOficial(solicitud)
    await cerrarCorteOficial('c1', '2026-08-09T11:30:00Z')

    expect(get).toHaveBeenCalledWith('/veedor/cortes', { params: { sectorId: 'manga' } })
    expect(post).toHaveBeenCalledWith('/veedor/cortes', solicitud)
    expect(patch).toHaveBeenCalledWith('/veedor/cortes/c1/cierre', { horaReal: '2026-08-09T11:30:00Z' })
  })

  it('pide la cola de ingesta completa y expone el total real del servidor', async () => {
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [{ id: 'p1', sectorId: 'manga', estadoPropuesto: 'SIN_SERVICIO', fuente: 'acuacar' }],
      headers: { 'x-total-count': '5' },
    })

    await expect(listarPropuestasIngesta()).resolves.toEqual({
      items: [{ id: 'p1', sectorId: 'manga', estadoPropuesto: 'SIN_SERVICIO', fuente: 'acuacar' }],
      totalCount: 5,
    })
    expect(get).toHaveBeenCalledWith('/veedor/ingesta/propuestas', { params: { tamano: 200 } })
  })
})
