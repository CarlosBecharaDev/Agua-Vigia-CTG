import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PaginaCuentas from './PaginaCuentas'
import type { Permiso } from '../api/client'

const listarCuentasMock = vi.fn()
const listarAuditoriaMock = vi.fn()
const mockUseSesionVeedor = vi.fn()

vi.mock('../api/services', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/services')>()
  return {
    ...actual,
    listarCuentas: (...args: unknown[]) => listarCuentasMock(...args),
    listarAuditoria: (...args: unknown[]) => listarAuditoriaMock(...args),
  }
})

vi.mock('../hooks/useSesionVeedor', () => ({
  useSesionVeedor: () => mockUseSesionVeedor(),
}))

function renderizarConQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/cuentas']}>
        <Routes>
          <Route path="/veedor" element={<div>Panel de Acceso Veedor</div>} />
          <Route path="/cuentas" element={<PaginaCuentas />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PaginaCuentas (M15 / REC-004)', () => {
  beforeEach(() => {
    listarCuentasMock.mockResolvedValue([])
    listarAuditoriaMock.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('redirige a /veedor si el usuario no está autenticado', () => {
    mockUseSesionVeedor.mockReturnValue({
      sesion: null,
      autenticado: false,
      puede: () => false,
    })

    renderizarConQueryClient()
    expect(screen.getByText('Panel de Acceso Veedor')).toBeInTheDocument()
  })

  it('muestra aviso restringido si el veedor autenticado no tiene permiso GESTIONAR_USUARIOS', () => {
    mockUseSesionVeedor.mockReturnValue({
      sesion: { identificador: 'veedor1', rol: 'VEEDOR', permisos: ['MODERAR_REPORTES'] },
      autenticado: true,
      puede: (p: Permiso) => p === 'MODERAR_REPORTES',
    })

    renderizarConQueryClient()
    expect(screen.getByRole('heading', { name: /esta zona es solo para administradores/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al panel/i })).toHaveAttribute('href', '/veedor')
  })

  it('muestra la interfaz de administración y lista de cuentas cuando el usuario tiene permiso GESTIONAR_USUARIOS', async () => {
    mockUseSesionVeedor.mockReturnValue({
      sesion: {
        identificador: 'admin1',
        usuarioId: 'admin-id',
        rol: 'ADMIN',
        permisos: ['GESTIONAR_USUARIOS', 'APROBAR_CUENTAS', 'EDITAR_PERMISOS', 'INVITAR_USUARIOS'],
      },
      autenticado: true,
      puede: (p: Permiso) =>
        ['GESTIONAR_USUARIOS', 'APROBAR_CUENTAS', 'EDITAR_PERMISOS', 'INVITAR_USUARIOS'].includes(p),
    })

    listarCuentasMock.mockResolvedValue([
      {
        id: 'cta-1',
        correo: 'veedor@aguavigia.org',
        nombre: 'Veedor Cartagena',
        rol: 'VEEDOR',
        estado: 'ACTIVA',
        segundoFactorActivo: true,
        permisosEfectivos: [],
        permisosConcedidos: [],
        permisosRevocados: [],
        creadoEn: '2026-09-01T12:00:00Z',
        actualizadoEn: '2026-09-01T12:00:00Z',
      },
    ])

    renderizarConQueryClient()

    expect(await screen.findByRole('heading', { name: /cuentas del panel/i })).toBeInTheDocument()
    expect(await screen.findByText('veedor@aguavigia.org')).toBeInTheDocument()
    expect(screen.getByText('Veedor Cartagena')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay cuentas que coincidan con el estado', async () => {
    mockUseSesionVeedor.mockReturnValue({
      sesion: {
        identificador: 'admin1',
        usuarioId: 'admin-id',
        rol: 'ADMIN',
        permisos: ['GESTIONAR_USUARIOS'],
      },
      autenticado: true,
      puede: (p: Permiso) => p === 'GESTIONAR_USUARIOS',
    })

    listarCuentasMock.mockResolvedValue([])

    renderizarConQueryClient()

    expect(await screen.findByText('No hay cuentas en este estado.')).toBeInTheDocument()
  })
})
