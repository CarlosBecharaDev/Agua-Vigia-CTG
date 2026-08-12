import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormularioReporte } from './FormularioReporte'

const crearReporte = vi.fn()
const agregarEvidenciaReporte = vi.fn()
const obtenerHuellaDispositivo = vi.fn()

vi.mock('../api/services', () => ({
  crearReporte: (...args: unknown[]) => crearReporte(...args),
  agregarEvidenciaReporte: (...args: unknown[]) => agregarEvidenciaReporte(...args),
}))
vi.mock('../utils/huellaDispositivo', () => ({
  obtenerHuellaDispositivo: () => obtenerHuellaDispositivo(),
}))

function renderizar(onReporteEnviado = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <FormularioReporte
        sectores={[
          { id: 'manga', nombre: 'MANGA', estado: null, actualizadoEn: null },
          { id: 'bocagrande', nombre: 'BOCAGRANDE', estado: null, actualizadoEn: null },
        ]}
        onReporteEnviado={onReporteEnviado}
      />
    </QueryClientProvider>,
  )
  return onReporteEnviado
}

afterEach(() => {
  crearReporte.mockReset()
  agregarEvidenciaReporte.mockReset()
  obtenerHuellaDispositivo.mockReset()
})

describe('FormularioReporte', () => {
  it('envía el reporte real con una huella anónima', async () => {
    crearReporte.mockResolvedValue({ id: 'reporte-1' })
    obtenerHuellaDispositivo.mockResolvedValue('huella-sha256')
    const onReporteEnviado = renderizar()

    fireEvent.change(screen.getByLabelText(/selecciona tu barrio/i), { target: { value: 'manga' } })
    fireEvent.click(screen.getByRole('button', { name: /no tengo agua/i }))

    await waitFor(() => expect(crearReporte.mock.calls[0]?.[0]).toEqual({
      sectorId: 'manga',
      tipo: 'SIN_AGUA',
      huella: 'huella-sha256',
    }))
    await waitFor(() => expect(onReporteEnviado).toHaveBeenCalledOnce())
  })

  it('sube la foto adjunta después de crear el reporte', async () => {
    crearReporte.mockResolvedValue({ id: 'reporte-1' })
    agregarEvidenciaReporte.mockResolvedValue({ id: 'reporte-1', fotoUrl: '/fotos/evidencia.jpg' })
    obtenerHuellaDispositivo.mockResolvedValue('huella-sha256')
    const onReporteEnviado = renderizar()

    const foto = new File(['contenido'], 'evidencia.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/adjuntar una foto/i), { target: { files: [foto] } })
    fireEvent.change(screen.getByLabelText(/selecciona tu barrio/i), { target: { value: 'manga' } })
    fireEvent.click(screen.getByRole('button', { name: /no tengo agua/i }))

    await waitFor(() => expect(agregarEvidenciaReporte).toHaveBeenCalledWith('reporte-1', foto))
    await waitFor(() => expect(onReporteEnviado).toHaveBeenCalledOnce())
    expect(onReporteEnviado.mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: 'reporte-1', fotoUrl: '/fotos/evidencia.jpg' }),
    )
  })

  it('rechaza una foto que no sea JPG, PNG o WebP', () => {
    renderizar()
    const foto = new File(['contenido'], 'evidencia.gif', { type: 'image/gif' })

    fireEvent.change(screen.getByLabelText(/adjuntar una foto/i), { target: { files: [foto] } })

    expect(screen.getByRole('alert')).toHaveTextContent(/jpg, png o webp/i)
  })

  it('no muestra éxito cuando el backend rechaza el reporte', async () => {
    crearReporte.mockRejectedValue({
      isAxiosError: true,
      response: { status: 429, data: { detail: 'Alcanzaste el límite de reportes para este barrio.' } },
    })
    obtenerHuellaDispositivo.mockResolvedValue('huella-sha256')
    const onReporteEnviado = renderizar()

    fireEvent.change(screen.getByLabelText(/selecciona tu barrio/i), { target: { value: 'bocagrande' } })
    fireEvent.click(screen.getByRole('button', { name: /presión muy baja/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/alcanzaste el límite/i)
    expect(onReporteEnviado).not.toHaveBeenCalled()
  })
})
