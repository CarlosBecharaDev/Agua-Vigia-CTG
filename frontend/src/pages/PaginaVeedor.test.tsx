import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PaginaVeedor from './PaginaVeedor'

const api = vi.hoisted(() => ({
  iniciarSesionVeedor: vi.fn(),
  listarReportesPendientes: vi.fn(),
  obtenerSectores: vi.fn(),
  listarCortesPorSector: vi.fn(),
  obtenerCorte: vi.fn(),
  moderarReporte: vi.fn(),
  crearCorteOficial: vi.fn(),
  cerrarCorteOficial: vi.fn(),
  listarPropuestasIngesta: vi.fn(),
  aprobarPropuestaIngesta: vi.fn(),
  descartarPropuestaIngesta: vi.fn(),
  obtenerSaludIngesta: vi.fn(),
  obtenerIndiceCumplimientoPorCorte: vi.fn(),
}))

vi.mock('../api/services', () => ({
  ...api,
  cerrarSesionVeedor: () => sessionStorage.removeItem('aguavigia_veedor_token'),
}))

function renderizar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter><PaginaVeedor /></MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  // Ninguno de los tests existentes cubre la cola de ingesta — que resuelva vacío por
  // defecto evita que su useQuery quede pendiente para siempre y bloquee el render.
  api.listarPropuestasIngesta.mockResolvedValue({ items: [], totalCount: 0 })
  api.obtenerSaludIngesta.mockResolvedValue([])
})

afterEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset())
  sessionStorage.clear()
})

describe('PaginaVeedor', () => {
  it('inicia sesión y carga la cola real de moderación', async () => {
    api.iniciarSesionVeedor.mockImplementation(async () => sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba'))
    api.listarReportesPendientes.mockResolvedValue({ items: [{ id: 'r1', sectorId: 'manga', tipo: 'SIN_AGUA', timestamp: '2026-08-09T10:00:00Z', estadoModeracion: 'PENDIENTE' }], totalCount: 1 })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }] })
    renderizar()

    fireEvent.change(screen.getByLabelText(/clave del veedor/i), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(api.iniciarSesionVeedor).toHaveBeenCalledWith('secreta'))
    expect(await screen.findByRole('heading', { name: /centro operativo del veedor/i })).toBeInTheDocument()
    expect(await screen.findByText('SIN AGUA')).toBeInTheDocument()
  })

  it('aprueba un reporte usando la API protegida', async () => {
    sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    api.listarReportesPendientes.mockResolvedValue({ items: [{ id: 'r1', sectorId: 'manga', tipo: 'SIN_AGUA', timestamp: '2026-08-09T10:00:00Z', estadoModeracion: 'PENDIENTE' }], totalCount: 1 })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [] })
    api.moderarReporte.mockResolvedValue({ id: 'r1', estadoModeracion: 'APROBADO' })
    renderizar()

    fireEvent.click(await screen.findByRole('button', { name: /aprobar/i }))
    await waitFor(() => expect(api.moderarReporte).toHaveBeenCalledWith('r1', 'aprobar'))
  })

  it('avisa cuando la cola de moderación tiene más pendientes de los que caben en una página', async () => {
    sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    api.listarReportesPendientes.mockResolvedValue({
      items: [{ id: 'r1', sectorId: 'manga', tipo: 'SIN_AGUA', timestamp: '2026-08-09T10:00:00Z', estadoModeracion: 'PENDIENTE' }],
      totalCount: 250,
    })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [] })
    renderizar()

    expect(await screen.findByText(/mostrando 1 de 250 reportes pendientes/i)).toBeInTheDocument()
  })

  it('registra un corte oficial para los barrios seleccionados', async () => {
    sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    api.listarReportesPendientes.mockResolvedValue({ items: [], totalCount: 0 })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }] })
    api.crearCorteOficial.mockResolvedValue({ id: 'c1', estado: 'ABIERTO' })
    renderizar()

    fireEvent.click(await screen.findByRole('checkbox', { name: 'MANGA' }))
    fireEvent.change(screen.getByLabelText(/^inicio$/i), { target: { value: '2026-08-09T10:00' } })
    fireEvent.change(screen.getByLabelText(/fin prometido/i), { target: { value: '2026-08-09T12:00' } })
    fireEvent.change(screen.getByLabelText(/^causa$/i), { target: { value: 'Mantenimiento preventivo' } })
    fireEvent.click(screen.getByRole('button', { name: /registrar corte oficial/i }))

    await waitFor(() => expect(api.crearCorteOficial.mock.calls[0]?.[0]).toEqual({
      sectoresAfectados: ['manga'],
      inicio: expect.any(String),
      finPrometido: expect.any(String),
      causa: 'Mantenimiento preventivo',
    }))
  })

  it('muestra el detalle y el índice de cumplimiento de un corte restablecido', async () => {
    sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    api.listarReportesPendientes.mockResolvedValue({ items: [], totalCount: 0 })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }] })
    api.listarCortesPorSector.mockResolvedValue([{ id: 'c1', causa: 'Mantenimiento', estado: 'RESTABLECIDO', finPrometido: '2026-08-09T12:00:00Z' }])
    api.obtenerCorte.mockResolvedValue({
      id: 'c1', causa: 'Mantenimiento', estado: 'RESTABLECIDO', origen: 'VEEDOR',
      inicio: '2026-08-09T10:00:00Z', finPrometido: '2026-08-09T12:00:00Z', finReal: '2026-08-09T13:00:00Z',
    })
    api.obtenerIndiceCumplimientoPorCorte.mockResolvedValue({
      sectorId: null, duracionPrometidaSegundos: 7200, duracionRealSegundos: 10800, desviacionSegundos: 3600, porcentajeCumplimiento: 66.7,
    })
    renderizar()

    await screen.findByRole('option', { name: 'MANGA' })
    fireEvent.change(screen.getByLabelText(/consultar barrio/i), { target: { value: 'manga' } })
    fireEvent.click(await screen.findByRole('button', { name: /ver detalle del corte/i }))

    await waitFor(() => expect(api.obtenerCorte).toHaveBeenCalledWith('c1'))
    await waitFor(() => expect(api.obtenerIndiceCumplimientoPorCorte).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText(/67%/)).toBeInTheDocument()
  })

  it('no ofrece "marcar restablecido" para un corte que ya está restablecido', async () => {
    sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    api.listarReportesPendientes.mockResolvedValue({ items: [], totalCount: 0 })
    api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }] })
    api.listarCortesPorSector.mockResolvedValue([{ id: 'c1', causa: 'Mantenimiento', estado: 'RESTABLECIDO', finPrometido: '2026-08-09T12:00:00Z' }])
    renderizar()

    await screen.findByRole('option', { name: 'MANGA' })
    fireEvent.change(screen.getByLabelText(/consultar barrio/i), { target: { value: 'manga' } })

    await screen.findByText('Mantenimiento')
    expect(screen.queryByRole('button', { name: /marcar restablecido/i })).not.toBeInTheDocument()
  })

  it('explica un 503 sin simular el ingreso', async () => {
    api.iniciarSesionVeedor.mockRejectedValue({ isAxiosError: true, response: { status: 503, data: {} } })
    renderizar()
    fireEvent.change(screen.getByLabelText(/clave del veedor/i), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/todavía no está configurada/i)
    expect(screen.getByLabelText(/clave del veedor/i)).toBeInTheDocument()
  })
})
