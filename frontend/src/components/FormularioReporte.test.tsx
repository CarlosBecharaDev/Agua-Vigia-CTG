import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AguaVigiaAPI } from '../api/services'
import { FormularioReporte } from './FormularioReporte'

describe('FormularioReporte', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('muestra error y no confirma un reporte cuando el envío falla', async () => {
    vi.spyOn(AguaVigiaAPI, 'enviarReporte').mockRejectedValue(new Error('backend no disponible'))
    const onReporteEnviado = vi.fn()

    render(
      <FormularioReporte
        sectores={[{ id: '1', nombre: 'BOCAGRANDE' }]}
        sectorPreseleccionado="1"
        onReporteEnviado={onReporteEnviado}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /no tengo agua/i }))
    fireEvent.submit(screen.getByRole('button', { name: /enviar reporte/i }).closest('form')!)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo enviar el reporte/i)
    expect(onReporteEnviado).not.toHaveBeenCalled()
  })
})
