import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaSector from './PaginaSector'

const obtenerSector = vi.fn()
vi.mock('../api/services', () => ({ obtenerSector: (...args: unknown[]) => obtenerSector(...args) }))

function renderizar(id = 'manga') {
  return render(
    <MemoryRouter initialEntries={[`/sectores/${id}`]}>
      <Routes>
        <Route path="/sectores/:id" element={<PaginaSector />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => obtenerSector.mockReset())

describe('PaginaSector', () => {
  it('muestra el estado del sector que llega desde el enlace del correo', async () => {
    obtenerSector.mockResolvedValue({ id: 'manga', nombre: 'MANGA', estado: 'SIN_SERVICIO', actualizadoEn: '2026-08-09T10:00:00Z' })
    renderizar('manga')

    expect(await screen.findByRole('heading', { name: 'MANGA' })).toBeInTheDocument()
    expect(obtenerSector).toHaveBeenCalledWith('manga')
    expect(screen.getByRole('link', { name: /reportar algo en este sector/i })).toHaveAttribute('href', '/reportar?sector=manga')
  })

  it('muestra un mensaje claro cuando el sector no existe', async () => {
    obtenerSector.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: { detail: "No existe el sector 'no-existe'" } } })
    renderizar('no-existe')

    expect(await screen.findByRole('heading', { name: /no encontramos este sector/i })).toBeInTheDocument()
  })
})
