import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PaginaMapa from './PaginaMapa'

const mockUseDatosEnVivo = vi.fn()
vi.mock('../hooks/useDatosEnVivo', () => ({
  useDatosEnVivo: () => mockUseDatosEnVivo(),
}))

vi.mock('../components/MapaCartagena', () => ({
  MapaCartagena: (props: unknown) => (
    <div data-testid="mapa-cartagena" data-props={JSON.stringify(props)}>
      Mapa Cartagena Mock
    </div>
  ),
}))

function renderizarPaginaMapa(tema: 'claro' | 'oscuro' = 'oscuro') {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <PaginaMapa temaActivo={tema} onAlternarTema={vi.fn()} />
    </MemoryRouter>,
  )
}

describe('PaginaMapa (M1 / REC-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDatosEnVivo.mockReturnValue({
      estado: 'success',
      sectores: [
        { id: 'sec-1', nombre: 'BOCAGRANDE', estado: 'CON_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' },
        { id: 'sec-2', nombre: 'CRESPO', estado: 'SIN_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' },
      ],
      cargando: false,
      error: null,
      ultimaActualizacion: new Date('2026-09-01T12:00:00Z'),
      conexionViva: true,
      boletines: [],
      recargar: vi.fn(),
    })
  })

  it('monta el mapa y la estructura principal de la página', () => {
    renderizarPaginaMapa()
    expect(screen.getByTestId('mapa-cartagena')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(document.getElementById('logo-aguavigia')).toBeInTheDocument()
  })

  it('pasa la bandera cargando a los componentes hijos cuando los datos se están recuperando', () => {
    mockUseDatosEnVivo.mockReturnValue({
      estado: 'loading',
      sectores: [],
      cargando: true,
      error: null,
      ultimaActualizacion: null,
      conexionViva: false,
      boletines: [],
      recargar: vi.fn(),
    })

    renderizarPaginaMapa()
    const mapaMock = screen.getByTestId('mapa-cartagena')
    expect(mapaMock.getAttribute('data-props')).toContain('"cargando":true')
  })

  it('permite colapsar y expandir el panel lateral con el botón correspondiente', () => {
    renderizarPaginaMapa()
    const botonColapsar = document.querySelector('.boton-colapsar-panel')
    expect(botonColapsar).toBeInTheDocument()

    const contenedorPanel = document.querySelector('.panel-mapa-unificado')
    expect(contenedorPanel).not.toHaveClass('panel-mapa-unificado--colapsado')

    fireEvent.click(botonColapsar!)
    expect(contenedorPanel).toHaveClass('panel-mapa-unificado--colapsado')

    fireEvent.click(botonColapsar!)
    expect(contenedorPanel).not.toHaveClass('panel-mapa-unificado--colapsado')
  })

  it('no antepone una portada promocional al mapa', () => {
    renderizarPaginaMapa()
    expect(document.querySelector('.portada-movil')).not.toBeInTheDocument()
    expect(screen.getByTestId('mapa-cartagena')).toBeInTheDocument()
  })

  it('muestra indisponibilidad y reintento sin publicar cuatro conteos cero', () => {
    const recargar = vi.fn()
    mockUseDatosEnVivo.mockReturnValue({
      estado: 'error',
      sectores: [],
      cargando: false,
      error: 'No fue posible conectar con el servicio.',
      ultimaActualizacion: null,
      conexionViva: false,
      boletines: [],
      recargar,
    })

    renderizarPaginaMapa()

    expect(screen.getByRole('alert')).toHaveTextContent('Información no disponible')
    expect(screen.getByText('No fue posible conectar con el servicio.')).toBeInTheDocument()
    expect(screen.queryByText('Con servicio')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin servicio')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar consulta' }))
    expect(recargar).toHaveBeenCalledTimes(1)
  })

  it('distingue una respuesta vacía de una consulta fallida', () => {
    mockUseDatosEnVivo.mockReturnValue({
      estado: 'empty',
      sectores: [],
      cargando: false,
      error: null,
      ultimaActualizacion: '2026-09-01T12:00:00Z',
      conexionViva: true,
      boletines: [],
      recargar: vi.fn(),
    })

    renderizarPaginaMapa()
    expect(screen.getByText('Aún no hay sectores publicados')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('advierte cuando conserva datos previos pero el canal en vivo está interrumpido', () => {
    mockUseDatosEnVivo.mockReturnValue({
      estado: 'stale',
      sectores: [
        { id: 'sec-1', nombre: 'BOCAGRANDE', estado: 'CON_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' },
      ],
      cargando: false,
      error: 'La actualización falló.',
      ultimaActualizacion: '2026-09-01T12:00:00Z',
      conexionViva: false,
      boletines: [],
      recargar: vi.fn(),
    })

    renderizarPaginaMapa()
    expect(screen.getByText('Mostrando la última información disponible')).toBeInTheDocument()
    expect(screen.getByText('Con servicio')).toBeInTheDocument()
  })
})
