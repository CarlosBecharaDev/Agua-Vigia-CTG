import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SeccionVeedor } from './SeccionVeedor'

const api = vi.hoisted(() => ({
  iniciarSesionVeedor: vi.fn(),
  cerrarSesionVeedor: vi.fn(),
  solicitarCuenta: vi.fn(),
  pedirRestablecimiento: vi.fn(),
}))

vi.mock('../api/services', () => api)

/** Delata cualquier navegación: si el modal saca al usuario de la portada, esto aparece. */
function renderizar() {
  const onCerrarLogin = vi.fn()
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SeccionVeedor loginAbierto onCerrarLogin={onCerrarLogin} />} />
        <Route path="*" element={<p>SALIÓ DE LA PORTADA</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onCerrarLogin }
}

afterEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset())
  sessionStorage.clear()
})

describe('SeccionVeedor — ingreso emergente', () => {
  it('abre en el ingreso', () => {
    renderizar()
    expect(screen.getByRole('heading', { name: /ingreso del veedor/i })).toBeInTheDocument()
  })

  /**
   * El defecto que corrige esto: «Solicitar una cuenta» era un `<Link>` a `/cuentas/registro`, así
   * que pedir una cuenta cerraba la portada y mandaba al usuario a otra pantalla a escribir un
   * correo. Las tres vistas son el mismo trámite y ocurren en el mismo sitio.
   */
  it('solicita una cuenta dentro del modal, sin cambiar de pantalla', () => {
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /solicitar una cuenta/i }))

    expect(screen.getByRole('heading', { name: /solicitar una cuenta/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/tu nombre/i)).toBeInTheDocument()
    expect(screen.queryByText(/salió de la portada/i)).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('restablece la clave dentro del modal, sin cambiar de pantalla', () => {
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /olvidé mi clave/i }))

    expect(screen.getByRole('heading', { name: /restablecer la clave/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo de tu cuenta/i)).toBeInTheDocument()
    expect(screen.queryByText(/salió de la portada/i)).not.toBeInTheDocument()
  })

  it('vuelve al ingreso desde cualquiera de las dos vistas', () => {
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /olvidé mi clave/i }))
    fireEvent.click(screen.getByRole('button', { name: /volver al ingreso/i }))

    expect(screen.getByRole('heading', { name: /ingreso del veedor/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^clave$/i)).toBeInTheDocument()
  })

  it('envia la solicitud de cuenta contra la API real y confirma sin prometer acceso', async () => {
    api.solicitarCuenta.mockResolvedValue(undefined)
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /solicitar una cuenta/i }))

    fireEvent.change(screen.getByLabelText(/tu nombre/i), { target: { value: 'Vecina de Manga' } })
    fireEvent.change(screen.getByLabelText(/^correo$/i), { target: { value: 'vecina@correo.co' } })
    fireEvent.change(screen.getByLabelText(/elige tu clave/i), { target: { value: 'clave-larga-y-variada' } })
    fireEvent.click(screen.getByRole('button', { name: /solicitar acceso/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/espera a que un administrador apruebe/i)
    expect(api.solicitarCuenta).toHaveBeenCalledWith('vecina@correo.co', 'Vecina de Manga', 'clave-larga-y-variada')
  })

  /** No delata si el correo existe: el backend responde igual en los dos casos. */
  it('confirma el envio del enlace sin decir si el correo tenia cuenta', async () => {
    api.pedirRestablecimiento.mockResolvedValue(undefined)
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /olvidé mi clave/i }))

    fireEvent.change(screen.getByLabelText(/correo de tu cuenta/i), { target: { value: 'quien@sea.co' } })
    fireEvent.click(screen.getByRole('button', { name: /enviarme el enlace/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/si esa dirección tiene una cuenta activa/i)
  })
})
