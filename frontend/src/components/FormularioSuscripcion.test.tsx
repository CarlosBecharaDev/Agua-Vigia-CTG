import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormularioSuscripcion } from './FormularioSuscripcion'

const crearSuscripcion = vi.fn()
vi.mock('../api/services', () => ({ crearSuscripcion: (...args: unknown[]) => crearSuscripcion(...args) }))

function renderizar() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <FormularioSuscripcion sectores={[{ id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null }]} />
    </QueryClientProvider>,
  )
}

afterEach(() => crearSuscripcion.mockReset())

describe('FormularioSuscripcion', () => {
  it('crea una suscripción pendiente de confirmación', async () => {
    crearSuscripcion.mockResolvedValue({ estado: 'PENDIENTE_CONFIRMACION' })
    renderizar()
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'vecino@correo.com' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'MANGA' }))
    fireEvent.click(screen.getByRole('button', { name: /enviar confirmación/i }))
    await waitFor(() => expect(crearSuscripcion.mock.calls[0]?.[0]).toEqual({ correo: 'vecino@correo.com', sectorIds: ['manga'] }))
    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument()
  })

  it('muestra el detalle RFC 7807 cuando el servidor rechaza el correo', async () => {
    crearSuscripcion.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { detail: 'El correo no es válido.' } } })
    renderizar()
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'x@x.co' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'MANGA' }))
    fireEvent.click(screen.getByRole('button', { name: /enviar confirmación/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/correo no es válido/i)
  })
})
