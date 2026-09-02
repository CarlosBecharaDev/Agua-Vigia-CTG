import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SeccionEstadisticas } from './SeccionEstadisticas'
import type { EstadisticasGlobales, IndiceCumplimiento } from '../api/services'

const obtenerEstadisticas = vi.fn()
const obtenerIndiceCumplimientoGlobal = vi.fn()

vi.mock('../api/services', () => ({
  obtenerEstadisticas: () => obtenerEstadisticas(),
  obtenerIndiceCumplimientoGlobal: () => obtenerIndiceCumplimientoGlobal(),
  urlExportarCumplimientoCsv: () => '/api/cumplimiento/exportar.csv',
  urlExportarEstadisticasCsv: () => '/api/estadisticas/exportar.csv',
}))

const ESTADISTICAS_VACIAS: EstadisticasGlobales = {
  sectoresMasAfectados: [],
  cortesPorDiaDeSemana: {},
  duracionPromedioHoras: 0,
}

const CUMPLIMIENTO_REAL: IndiceCumplimiento = {
  sectorId: null,
  duracionPrometidaSegundos: 7200,
  duracionRealSegundos: 28800,
  desviacionSegundos: 21600,
  porcentajeCumplimiento: 25,
}

afterEach(() => {
  obtenerEstadisticas.mockReset()
  obtenerIndiceCumplimientoGlobal.mockReset()
})

describe('SeccionEstadisticas', () => {
  /**
   * BUG-063 (S1) — cuando la API responde «No hay cortes cerrados todavía», la sección mostraba
   * 100% de cumplimiento y 2.822 h contra 2.798,5 h: cinco literales escritos a mano. Inventar la
   * cifra que la plataforma existe para contrastar es el peor fallo posible aquí, no un cosmético.
   */
  it('no debe afirmar ningun cumplimiento cuando la API no tiene cortes cerrados', async () => {
    obtenerEstadisticas.mockResolvedValue(ESTADISTICAS_VACIAS)
    obtenerIndiceCumplimientoGlobal.mockRejectedValue(new Error('No hay cortes cerrados todavía'))

    render(<SeccionEstadisticas />)

    await waitFor(() => expect(screen.getAllByText('Sin datos').length).toBeGreaterThan(0))
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
    expect(screen.queryByText(/2822|2\.822/)).not.toBeInTheDocument()
  })

  it('debe mostrar «Sin datos» en las tres metricas del Indice, no ceros', async () => {
    obtenerEstadisticas.mockResolvedValue(ESTADISTICAS_VACIAS)
    obtenerIndiceCumplimientoGlobal.mockRejectedValue(new Error('sin cortes'))

    render(<SeccionEstadisticas />)

    // Tiempo Prometido, Tiempo Real, Tasa de Cumplimiento, Cumplimiento Global y Duración Promedio.
    await waitFor(() => expect(screen.getAllByText('Sin datos')).toHaveLength(5))
    expect(screen.queryByText('0%')).not.toBeInTheDocument()
    expect(screen.queryByText('0.0 h')).not.toBeInTheDocument()
  })

  it('debe publicar el cumplimiento real cuando la API si lo entrega', async () => {
    obtenerEstadisticas.mockResolvedValue({
      sectoresMasAfectados: [{ sectorId: 'manga', nombre: 'MANGA', cantidadCortes: 4 }],
      cortesPorDiaDeSemana: { Lunes: 4 },
      duracionPromedioHoras: 6.5,
    })
    obtenerIndiceCumplimientoGlobal.mockResolvedValue(CUMPLIMIENTO_REAL)

    render(<SeccionEstadisticas />)

    // El diferencial del proyecto: «Prometieron 2 horas · Fueron 8».
    expect(await screen.findByText('2.0 h')).toBeInTheDocument()
    expect(screen.getByText('8.0 h')).toBeInTheDocument()
    expect(screen.getAllByText('25%').length).toBeGreaterThan(0)
    expect(screen.getByText('6.5 h')).toBeInTheDocument()
    expect(screen.getByText('MANGA')).toBeInTheDocument()
    expect(screen.queryByText('Sin datos')).not.toBeInTheDocument()
  })

  /**
   * Un fallo de la API no puede dejar la sección afirmando cifras. Hoy el aviso al usuario es el
   * indicador de red; lo que se protege aquí es que ninguna métrica se rellene con un valor
   * inventado cuando la consulta no respondió.
   */
  it('debe avisar que esta sin red y no inventar metricas cuando la consulta falla', async () => {
    obtenerEstadisticas.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { detail: 'No se pudo consultar la informacion en este momento.' } },
    })
    obtenerIndiceCumplimientoGlobal.mockRejectedValue(new Error('sin cortes'))

    render(<SeccionEstadisticas />)

    expect(await screen.findByText(/modo offline/i)).toBeInTheDocument()
    expect(screen.getAllByText('Sin datos')).toHaveLength(5)
  })
})
