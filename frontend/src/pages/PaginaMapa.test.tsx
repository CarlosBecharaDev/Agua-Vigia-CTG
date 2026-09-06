import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PaginaMapa from './PaginaMapa'

const mockUseDatosEnVivo = vi.fn()
const mockUseConsultaMedios = vi.fn()

vi.mock('../hooks/useDatosEnVivo', () => ({
  useDatosEnVivo: () => mockUseDatosEnVivo(),
}))

vi.mock('../hooks/useConsultaMedios', () => ({
  useConsultaMedios: () => mockUseConsultaMedios(),
}))

vi.mock('../components/MapaCartagena', () => ({
  MapaCartagena: (props: unknown) => (
    <div data-testid="mapa-cartagena" data-props={JSON.stringify(props)}>
      Mapa Cartagena Mock
    </div>
  ),
}))

vi.mock('../components/GradientWaves/GradientWaves', () => ({
  GradientWaves: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="gradient-waves">{children}</div>
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
    mockUseConsultaMedios.mockReturnValue(false)
    mockUseDatosEnVivo.mockReturnValue({
      sectores: [
        { id: 'sec-1', nombre: 'BOCAGRANDE', estado: 'CON_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' },
        { id: 'sec-2', nombre: 'CRESPO', estado: 'SIN_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' },
      ],
      cargando: false,
      error: null,
      ultimaActualizacion: new Date('2026-09-01T12:00:00Z'),
      conexionViva: true,
      boletines: [],
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
      sectores: [],
      cargando: true,
      error: null,
      ultimaActualizacion: null,
      conexionViva: false,
      boletines: [],
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

  it('monta la portada en pantallas pequeñas cuando el media query coincide', () => {
    mockUseConsultaMedios.mockReturnValue(true) // Simula móvil/pantalla pequeña <= 1024px

    renderizarPaginaMapa()
    const portada = document.querySelector('.portada-movil')
    expect(portada).toBeInTheDocument()
  })
})
