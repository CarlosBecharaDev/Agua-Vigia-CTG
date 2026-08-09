import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaginaVeedor from './PaginaVeedor'

const iniciarSesionVeedor = vi.fn()

vi.mock('../api/services', () => ({
  iniciarSesionVeedor: (...args: unknown[]) => iniciarSesionVeedor(...args),
  cerrarSesionVeedor: () => sessionStorage.removeItem('aguavigia_veedor_token'),
}))

afterEach(() => {
  iniciarSesionVeedor.mockReset()
  sessionStorage.clear()
})

describe('PaginaVeedor', () => {
  it('envía la clave usando el contrato real y bloquea la moderación', async () => {
    iniciarSesionVeedor.mockImplementation(async () => {
      sessionStorage.setItem('aguavigia_veedor_token', 'token-prueba')
    })
    render(<MemoryRouter><PaginaVeedor /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText(/clave del veedor/i), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(iniciarSesionVeedor).toHaveBeenCalledWith('secreta'))
    expect(await screen.findByRole('heading', { name: /sesión iniciada; moderación pendiente/i })).toBeInTheDocument()
    expect(screen.queryByText(/cola de validación/i)).not.toBeInTheDocument()
  })

  it('explica un 503 sin simular el ingreso', async () => {
    iniciarSesionVeedor.mockRejectedValue({ isAxiosError: true, response: { status: 503, data: {} } })
    render(<MemoryRouter><PaginaVeedor /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText(/clave del veedor/i), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/todavía no está configurada/i)
    expect(screen.getByLabelText(/clave del veedor/i)).toBeInTheDocument()
  })
})
