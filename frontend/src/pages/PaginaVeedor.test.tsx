import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaginaVeedor from './PaginaVeedor'
import { isSimulationMode } from '../config'

describe('PaginaVeedor', () => {
  it('muestra el acceso correspondiente al modo configurado', () => {
    render(<PaginaVeedor />)

    if (isSimulationMode) {
      expect(document.querySelector('input[type="password"]')).toBeNull()
      expect(screen.getByRole('button', { name: /simular ingreso/i })).toBeInTheDocument()
    } else {
      expect(screen.getByLabelText(/clave del veedor/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument()
    }
  })

  it('entra al panel de moderación sin credencial solo en simulación', () => {
    render(<PaginaVeedor />)

    if (!isSimulationMode) return

    fireEvent.click(screen.getByRole('button', { name: /simular ingreso/i }))

    expect(screen.getByRole('heading', { name: /central de moderación/i })).toBeInTheDocument()
  })
})
