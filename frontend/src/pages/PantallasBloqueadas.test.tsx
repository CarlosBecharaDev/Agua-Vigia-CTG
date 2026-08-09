import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PaginaEstadisticas from './PaginaEstadisticas'
import PaginaBitacora from './PaginaBitacora'
import PaginaNoEncontrada from './PaginaNoEncontrada'

const api = vi.hoisted(() => ({
  obtenerCumplimientoGlobal: vi.fn(),
  obtenerCumplimientoSector: vi.fn(),
  obtenerSectores: vi.fn(),
  obtenerBitacora: vi.fn(),
}))
vi.mock('../api/services', () => api)

const renderPagina = (pagina: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter>{pagina}</MemoryRouter></QueryClientProvider>)
}

beforeEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset())
  api.obtenerSectores.mockResolvedValue({ generadoEn: '2026-08-09T10:00:00Z', sectores: [] })
})

describe('pantallas públicas conectadas', () => {
  it('muestra el cumplimiento global entregado por la API', async () => {
    api.obtenerCumplimientoGlobal.mockResolvedValue({ duracionPrometidaSegundos: 3600, duracionRealSegundos: 4200, desviacionSegundos: 600, porcentajeCumplimiento: 85.7 })
    renderPagina(<PaginaEstadisticas />)
    expect(await screen.findByText('85,7%')).toBeInTheDocument()
    expect(api.obtenerCumplimientoGlobal).toHaveBeenCalledOnce()
  })

  it('muestra los eventos reales de la bitácora', async () => {
    api.obtenerBitacora.mockResolvedValue([{ id: 'e1', tipo: 'CORTE_RESTABLECIDO', timestamp: '2026-08-09T10:00:00Z', descripcion: 'Servicio normalizado', sectorId: 'manga' }])
    renderPagina(<PaginaBitacora />)
    expect(await screen.findByText('Servicio restablecido')).toBeInTheDocument()
    expect(screen.getByText('Servicio normalizado')).toBeInTheDocument()
  })

  it('ofrece una salida útil para una ruta inexistente', () => {
    renderPagina(<PaginaNoEncontrada />)
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver el mapa/i })).toHaveAttribute('href', '/')
  })
})
