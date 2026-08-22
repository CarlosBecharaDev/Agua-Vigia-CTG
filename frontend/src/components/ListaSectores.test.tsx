import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ListaSectores } from './ListaSectores'

const sectores = [
  {
    id: 'demo-1',
    nombre: 'BOCAGRANDE',
    estado: 'SIN_SERVICIO' as const,
    actualizadoEn: new Date().toISOString(),
  },
]

describe('ListaSectores', () => {
  it('mantiene los últimos datos reales visibles cuando la fuente falla, avisando que pueden estar desactualizados', () => {
    render(
      <ListaSectores
        sectores={sectores}
        cargando={false}
        error="Sin conexion"
        onSectorSeleccionado={vi.fn()}
      />
    )

    expect(screen.getByText('BOCAGRANDE')).toBeInTheDocument()
    expect(screen.getByText(/últimos datos que se cargaron/i)).toBeInTheDocument()
  })

  it('muestra un estado claro cuando no hay sectores disponibles', () => {
    render(
      <ListaSectores
        sectores={[]}
        cargando={false}
        error="Sin conexion"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/No pudimos cargar los sectores/i)
  })

  it('oculta de barrios monitoreados los sectores que todavía no tienen reporte', () => {
    render(<MemoryRouter>
      <ListaSectores
        sectores={[{ id: 'sin-dato', nombre: 'MANGA', estado: null, actualizadoEn: null }]}
        cargando={false}
        error={null}
      />,
    </MemoryRouter>)

    expect(screen.queryByText('MANGA')).not.toBeInTheDocument()
    expect(screen.getByText(/todavía no hay barrios con estado reportado/i)).toBeInTheDocument()
  })
})
