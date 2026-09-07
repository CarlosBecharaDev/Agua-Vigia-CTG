import { describe, expect, it } from 'vitest'
import type { EventoBitacora } from '../api/services'
import type { Sector } from '../types/tipos-dominio'
import { completarCatalogoBarrios, filtrarEventosRecientes, invalidarEstadoVencido } from './datosRecientes'

const AHORA = Date.parse('2026-09-06T12:00:00Z')

describe('vigencia pública de datos', () => {
  it('neutraliza un estado de barrio con más de 30 días sin actualización', () => {
    const sector: Sector = { id: 'manga', nombre: 'MANGA', estado: 'SIN_SERVICIO', actualizadoEn: '2026-08-01T11:59:59Z' }
    expect(invalidarEstadoVencido(sector, AHORA)).toMatchObject({ estado: null, actualizadoEn: sector.actualizadoEn })
  })

  it('conserva un estado actualizado dentro de los últimos 30 días', () => {
    const sector: Sector = { id: 'manga', nombre: 'MANGA', estado: 'SIN_SERVICIO', actualizadoEn: '2026-08-20T12:00:00Z' }
    expect(invalidarEstadoVencido(sector, AHORA).estado).toBe('SIN_SERVICIO')
  })

  it('descarta eventos antiguos y fechas futuras de la ficha pública', () => {
    const evento = (id: string, timestamp: string) => ({ id, timestamp, tipo: 'CORTE_ANUNCIADO', descripcion: id } as EventoBitacora)
    expect(filtrarEventosRecientes([
      evento('reciente', '2026-09-01T12:00:00Z'),
      evento('antiguo', '2026-07-01T12:00:00Z'),
      evento('futuro', '2026-09-07T12:00:00Z'),
    ], AHORA).map(({ id }) => id)).toEqual(['reciente'])
  })
})

describe('catálogo cartográfico', () => {
  it('mantiene todos los barrios y deja sin datos los ausentes de la API', () => {
    const sectores: Sector[] = [{ id: 'manga', nombre: 'MANGA', estado: 'CON_SERVICIO', actualizadoEn: '2026-09-01T12:00:00Z' }]
    const resultado = completarCatalogoBarrios(sectores, ['MANGA', 'CRESPO'])
    expect(resultado).toHaveLength(2)
    expect(resultado[1]).toMatchObject({ nombre: 'CRESPO', estado: null, actualizadoEn: null })
  })
})
