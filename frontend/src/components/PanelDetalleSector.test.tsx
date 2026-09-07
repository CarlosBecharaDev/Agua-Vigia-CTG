import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerIndiceCumplimientoPorSector, obtenerSerieCumplimiento } from '../api/services'
import { PanelDetalleSector } from './PanelDetalleSector'

vi.mock('../api/services', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/services')>()
  return {
    ...original,
    obtenerIndiceCumplimientoPorSector: vi.fn().mockRejectedValue(new Error('sin historial')),
    obtenerSerieCumplimiento: vi.fn().mockResolvedValue([]),
    urlExportarCumplimientoCsv: vi.fn(() => '/api/cumplimiento/serie.csv'),
  }
})

describe('PanelDetalleSector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra únicamente un evento reciente publicado por el backend', () => {
    render(
      <PanelDetalleSector
        sector={{ id: 'sector-1', nombre: 'Manga', estado: 'SIN_SERVICIO', actualizadoEn: new Date().toISOString() }}
        boletines={[{
          id: 'evento-1',
          tipo: 'CORTE_DETECTADO_POR_INGESTA',
          sectorId: 'sector-1',
          timestamp: new Date().toISOString(),
          descripcion: 'Interrupción publicada y verificada por el sistema.',
          urlOriginal: 'https://acuacar.com/boletin/1',
        }]}
        onCerrar={vi.fn()}
        onAbrirReporte={vi.fn()}
      />,
    )

    expect(screen.getByText('Interrupción publicada y verificada por el sistema.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir fuente original · acuacar/i })).toHaveAttribute('href', 'https://acuacar.com/boletin/1')
    expect(screen.queryByText(/24[.,]380|carrotanque|avance estimado|habitantes afectados/i)).not.toBeInTheDocument()
  })

  it('no envía reportes con un identificador creado solo para la cartografía', () => {
    render(
      <PanelDetalleSector
        sector={{ id: 'geo-barrio-cartografico', nombre: 'Barrio cartográfico', estado: null, actualizadoEn: null }}
        boletines={[]}
        onCerrar={vi.fn()}
        onAbrirReporte={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /reportar problema/i })).not.toBeInTheDocument()
    expect(screen.getByText(/no se habilita un reporte inválido/i)).toBeInTheDocument()
    expect(obtenerIndiceCumplimientoPorSector).not.toHaveBeenCalled()
    expect(obtenerSerieCumplimiento).not.toHaveBeenCalled()
  })
})
