import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TarjetasEstadoMapa } from './TarjetasEstadoMapa'

describe('TarjetasEstadoMapa', () => {
  it('resume únicamente conteos publicados y no telemetría simulada', () => {
    render(
      <TarjetasEstadoMapa
        resumen={[
          { estado: 'SIN_SERVICIO', n: 1 },
          { estado: 'PRESION_BAJA', n: 2 },
          { estado: 'CORTE_PROGRAMADO', n: 0 },
          { estado: 'CON_SERVICIO', n: 4 },
        ]}
        estadoDestacado={null}
        onAlternar={vi.fn()}
        onAlternarBitacora={vi.fn()}
      />,
    )

    expect(screen.getByText('con servicio confirmado')).toBeInTheDocument()
    expect(screen.queryByText(/avance de reparación|nivel de presurización|tanque colinas|88\.4%|red matriz activa/i)).not.toBeInTheDocument()
  })
})
