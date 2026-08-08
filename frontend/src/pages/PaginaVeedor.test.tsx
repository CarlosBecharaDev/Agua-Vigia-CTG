import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PaginaVeedor from './PaginaVeedor'

describe('PaginaVeedor', () => {
  it('no expone ningún campo de contraseña (BUG-004)', () => {
    render(<PaginaVeedor />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(document.querySelector('input[type="password"]')).toBeNull()
  })

  it('entra al panel de moderación al simular el ingreso, sin credencial', () => {
    render(<PaginaVeedor />)

    fireEvent.click(screen.getByRole('button', { name: /simular ingreso de veedor/i }))

    expect(screen.getByRole('heading', { name: /panel de moderación/i })).toBeInTheDocument()
  })
})
