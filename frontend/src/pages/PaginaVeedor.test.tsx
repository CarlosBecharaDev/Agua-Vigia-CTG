import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import PaginaVeedor from './PaginaVeedor'
import { isSimulationMode } from '../config'
import { AguaVigiaAPI } from '../api/services'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PaginaVeedor', () => {
  it('muestra el acceso correspondiente al modo configurado', () => {
    render(<PaginaVeedor />)

    if (isSimulationMode) {
      expect(document.querySelector('input[type="password"]')).toBeNull()
      expect(screen.getByRole('button', { name: /simular ingreso/i })).toBeInTheDocument()
    } else {
      expect(screen.getByLabelText(/clave del veedor/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument()
    }
  })

  it('entra al panel de moderación sin credencial solo en simulación', () => {
    render(<PaginaVeedor />)

    if (!isSimulationMode) return

    fireEvent.click(screen.getByRole('button', { name: /simular ingreso/i }))

    expect(screen.getByRole('heading', { name: /central de moderación/i })).toBeInTheDocument()
  })

  it('no confirma un aviso oficial cuando el backend falla', async () => {
    if (!isSimulationMode) return

    vi.spyOn(AguaVigiaAPI, 'obtenerReportesPendientes').mockResolvedValue([])
    vi.spyOn(AguaVigiaAPI, 'obtenerSectores').mockResolvedValue({ sectores: [] } as never)
    vi.spyOn(AguaVigiaAPI, 'registrarCorteOficial').mockRejectedValue(new Error('backend no disponible'))

    render(<PaginaVeedor />)
    fireEvent.click(screen.getByRole('button', { name: /simular ingreso/i }))
    fireEvent.click(screen.getByRole('button', { name: /crear anuncio/i }))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'todos' } })
    fireEvent.change(selects[1], { target: { value: 'mantenimiento' } })
    fireEvent.submit(selects[0].closest('form')!)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo publicar el aviso/i))
    expect(screen.queryByText(/aviso publicado con éxito/i)).not.toBeInTheDocument()
  })
})
