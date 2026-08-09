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
    const abrirSuscripcion = vi.fn()
    render(<MemoryRouter><Encabezado temaActivo="claro" onAlternarTema={alternarTema} onAbrirSuscripcion={abrirSuscripcion} /></MemoryRouter>)

    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /reportar/i }).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /cambiar a modo oscuro/i }))
    expect(alternarTema).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: /suscribirse a avisos/i }))
    expect(abrirSuscripcion).toHaveBeenCalledOnce()
  })

  it('ofrece una navegación móvil equivalente', () => {
    render(<MemoryRouter><Encabezado temaActivo="oscuro" onAlternarTema={vi.fn()} onAbrirSuscripcion={vi.fn()} /></MemoryRouter>)
    const navegacionMovil = screen.getByRole('navigation', { name: /navegación móvil/i })
    expect(navegacionMovil).toBeInTheDocument()
    expect(navegacionMovil).toHaveTextContent('Mapa')
    expect(navegacionMovil).toHaveTextContent('Reportar')
  })
})
