import { describe, expect, it } from 'vitest'
import { determinarEstadoBoletin, extraerBarriosDeTexto } from './acuacar'

describe('normalización de boletines de Acuacar', () => {
  it('no confunde CHILE dentro de NUEVO CHILE', () => {
    expect(extraerBarriosDeTexto('Mantenimiento en Nuevo Chile')).toEqual(['NUEVO CHILE'])
    expect(extraerBarriosDeTexto('Corte en Chile')).toEqual(['CHILE'])
  })

  it('aplica la misma clasificación a cualquier pantalla', () => {
    expect(determinarEstadoBoletin('Interrupción del servicio')).toBe('SIN_SERVICIO')
    expect(determinarEstadoBoletin('Servicio restablecido')).toBe('CON_SERVICIO')
    expect(determinarEstadoBoletin('Boletín informativo sin palabra clave')).toBe('CORTE_PROGRAMADO')
  })
})
