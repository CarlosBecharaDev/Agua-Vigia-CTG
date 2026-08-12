import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PaginaNoEncontrada from './PaginaNoEncontrada'

describe('rutas', () => {
  it('ofrece una salida útil para una ruta inexistente', () => {
    render(<MemoryRouter><PaginaNoEncontrada /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver el mapa/i })).toHaveAttribute('href', '/')
  })
})
