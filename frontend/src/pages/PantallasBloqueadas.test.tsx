import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { apiClient } from '../api/client'
import PaginaEstadisticas from './PaginaEstadisticas'
import PaginaBitacora from './PaginaBitacora'
import PaginaNoEncontrada from './PaginaNoEncontrada'

describe('pantallas sin contrato backend', () => {
  it.each([
    [PaginaEstadisticas, /estadísticas todavía no están disponibles/i],
    [PaginaBitacora, /bitácora pública está en preparación/i],
  ])('muestra indisponibilidad sin consultar la API', (Pagina, titulo) => {
    const get = vi.spyOn(apiClient, 'get')
    const post = vi.spyOn(apiClient, 'post')
    render(<MemoryRouter><Pagina /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalled()
    get.mockRestore()
    post.mockRestore()
  })

  it('ofrece una salida útil para una ruta inexistente', () => {
    render(<MemoryRouter><PaginaNoEncontrada /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /esta página no existe/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver el mapa/i })).toHaveAttribute('href', '/')
  })
})
