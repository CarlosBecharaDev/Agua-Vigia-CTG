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
      <FormularioSuscripcion sectores={[{ id: 'manga', nombre: 'MANGA', estado: 'CON_SERVICIO', actualizadoEn: null }]} />
    </QueryClientProvider>,
  )
}

function irAlPasoDeCorreo() {
  fireEvent.click(screen.getByRole('button', { name: /^siguiente$/i }))
}

function completarCorreoYAvanzar(correo: string) {
  fireEvent.change(screen.getByLabelText(/tu correo electrónico/i), { target: { value: correo } })
  fireEvent.click(screen.getByRole('button', { name: /^siguiente$/i }))
}

function elegirSectorYAvanzar() {
  fireEvent.focus(screen.getByLabelText(/buscar barrio/i))
  fireEvent.click(screen.getByRole('button', { name: 'Agregar MANGA' }))
  fireEvent.click(screen.getByRole('button', { name: /^siguiente$/i }))
}

afterEach(() => crearSuscripcion.mockReset())

describe('FormularioSuscripcion', () => {
  it('recorre los 4 pasos y crea una suscripción pendiente de confirmación', async () => {
    crearSuscripcion.mockResolvedValue({ estado: 'PENDIENTE_CONFIRMACION' })
    renderizar()

    irAlPasoDeCorreo()
    completarCorreoYAvanzar('vecino@correo.com')
    elegirSectorYAvanzar()
    fireEvent.click(screen.getByRole('button', { name: /enviar confirmación/i }))

    await waitFor(() => expect(crearSuscripcion.mock.calls[0]?.[0]).toEqual({ correo: 'vecino@correo.com', sectorIds: ['manga'] }))
    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument()
  })

  it('no deja avanzar del paso de correo con un correo inválido', () => {
    renderizar()
    irAlPasoDeCorreo()
    fireEvent.change(screen.getByLabelText(/tu correo electrónico/i), { target: { value: 'no-es-un-correo' } })
    expect(screen.getByRole('button', { name: /^siguiente$/i })).toBeDisabled()
  })

  it('no deja avanzar del paso de ubicación sin elegir ningún barrio', () => {
    renderizar()
    irAlPasoDeCorreo()
    completarCorreoYAvanzar('vecino@correo.com')
    expect(screen.getByRole('button', { name: /^siguiente$/i })).toBeDisabled()
  })

  it('muestra el detalle RFC 7807 cuando el servidor rechaza el correo', async () => {
    crearSuscripcion.mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { detail: 'El correo no es válido.' } } })
    renderizar()

    irAlPasoDeCorreo()
    completarCorreoYAvanzar('x@x.co')
    elegirSectorYAvanzar()
    fireEvent.click(screen.getByRole('button', { name: /enviar confirmación/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/correo no es válido/i)
  })
})
