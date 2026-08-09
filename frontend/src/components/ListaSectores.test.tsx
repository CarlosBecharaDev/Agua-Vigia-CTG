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
  it('mantiene los últimos datos reales visibles cuando la fuente falla, avisando que pueden estar desactualizados', () => {
    render(
      <ListaSectores
        sectores={sectores}
        cargando={false}
        error="Sin conexion"
        onSectorSeleccionado={vi.fn()}
      />,
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

  it('no inventa reportes para sectores sin datos', () => {
    render(
      <ListaSectores
        sectores={[{ id: 'sin-dato', nombre: 'MANGA', estado: null, actualizadoEn: null }]}
        cargando={false}
        error={null}
      />,
    )

    expect(screen.getByText('MANGA')).toBeInTheDocument()
    expect(screen.queryByText(/reportes ciudadanos/i)).not.toBeInTheDocument()
  })
})
