import { describe, expect, it } from 'vitest'
import { normalizarErrorApi } from './client'

function errorConEstado(status: number) {
  return { isAxiosError: true, response: { status, data: {} } }
}

describe('normalización RFC 7807', () => {
  it.each([
    [401, /clave no es correcta/i],
    [409, /ya existe/i],
    [429, /demasiados intentos/i],
    [503, /todavía no está configurada/i],
  ])('explica el estado %i', (estado, mensaje) => {
    expect(normalizarErrorApi(errorConEstado(estado)).detalle).toMatch(mensaje)
  })
})
