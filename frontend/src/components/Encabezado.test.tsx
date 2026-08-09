import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Encabezado } from './Encabezado'

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
})

describe('Encabezado', () => {
  it('mantiene navegación, reporte y selector de tema accesibles', () => {
    const alternarTema = vi.fn()
    render(<MemoryRouter><Encabezado temaActivo="claro" onAlternarTema={alternarTema} /></MemoryRouter>)

    expect(screen.getByRole('navigation', { name: /secciones/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /reportar/i }).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo oscuro/i }))
    expect(alternarTema).toHaveBeenCalledOnce()
  })

  it('abre y cierra el menú lateral con teclado', () => {
    render(<MemoryRouter><Encabezado temaActivo="oscuro" onAlternarTema={vi.fn()} /></MemoryRouter>)
    const abrir = screen.getByRole('button', { name: /abrir menú/i })
    fireEvent.click(abrir)
    expect(abrir).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(abrir).toHaveAttribute('aria-expanded', 'false')
  })
})
