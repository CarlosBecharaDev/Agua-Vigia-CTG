import { beforeEach, describe, expect, it } from 'vitest'
import { obtenerHuellaDispositivo } from './huellaDispositivo'

beforeEach(() => localStorage.clear())

describe('huella anónima del dispositivo', () => {
  it('es estable, hasheada y no expone la semilla persistida', async () => {
    const primera = await obtenerHuellaDispositivo()
    const segunda = await obtenerHuellaDispositivo()
    const semilla = localStorage.getItem('aguavigia_huella_dispositivo_v1')

    expect(primera).toBe(segunda)
    expect(primera).toMatch(/^[a-f0-9]{64}$/)
    expect(primera).not.toBe(semilla)
  })
})
