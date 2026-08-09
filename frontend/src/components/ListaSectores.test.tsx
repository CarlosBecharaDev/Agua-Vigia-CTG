import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
  it('mantiene los datos demo visibles cuando la fuente falla', () => {
    render(
      <ListaSectores
        sectores={sectores}
        cargando={false}
        error="Sin conexion"
        onSectorSeleccionado={vi.fn()}
      />,
    )

    expect(screen.getByText('BOCAGRANDE')).toBeInTheDocument()
    expect(screen.getByText(/datos de demostracion/i)).toBeInTheDocument()
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
})
