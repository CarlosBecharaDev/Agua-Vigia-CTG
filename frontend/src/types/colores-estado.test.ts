import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS, type EstadoServicio } from './tipos-dominio'

/**
 * Calcula la luminancia relativa en sRGB según especificación WCAG 2.1.
 */
function srgbLuminancia(hex: string): number {
  const limpio = hex.replace('#', '').trim()
  const r = parseInt(limpio.slice(0, 2), 16) / 255
  const g = parseInt(limpio.slice(2, 4), 16) / 255
  const b = parseInt(limpio.slice(4, 6), 16) / 255

  const aLineal = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * aLineal(r) + 0.7152 * aLineal(g) + 0.0722 * aLineal(b)
}

/**
 * Calcula el ratio de contraste entre dos colores HEX según WCAG 2.1.
 */
function calcularContraste(hex1: string, hex2: string): number {
  const l1 = srgbLuminancia(hex1)
  const l2 = srgbLuminancia(hex2)
  const claro = Math.max(l1, l2)
  const oscuro = Math.min(l1, l2)
  return (claro + 0.05) / (oscuro + 0.05)
}

describe('Paridad de colores de estado (ADR-042 / REC-015 / RNF012)', () => {
  const rutaCss = path.resolve(__dirname, '../index.css')
  const contenidoCss = fs.readFileSync(rutaCss, 'utf-8')

  it('COLOR_SIN_DATOS debe coincidir con el estado CON_SERVICIO', () => {
    expect(COLOR_SIN_DATOS.claro.toUpperCase()).toBe(COLOR_POR_ESTADO.CON_SERVICIO.claro.toUpperCase())
    expect(COLOR_SIN_DATOS.oscuro.toUpperCase()).toBe(COLOR_POR_ESTADO.CON_SERVICIO.oscuro.toUpperCase())
    expect(COLOR_SIN_DATOS.etiqueta).toBe('Con servicio')
  })

  it('los cuatro estados de COLOR_POR_ESTADO deben coincidir con los tokens de index.css', () => {
    const mapeoTokens: Record<EstadoServicio, string> = {
      CON_SERVICIO: 'con',
      SIN_SERVICIO: 'sin',
      PRESION_BAJA: 'baja',
      CORTE_PROGRAMADO: 'prog',
    }

    for (const [estado, sufijo] of Object.entries(mapeoTokens) as [EstadoServicio, string][]) {
      const regexClaro = new RegExp(`--color-estado-${sufijo}:\\s*(#[0-9a-fA-F]{6});`)
      const matchClaro = contenidoCss.match(regexClaro)
      expect(matchClaro, `Token claro --color-estado-${sufijo} no encontrado en index.css`).toBeTruthy()
      expect(matchClaro![1].toUpperCase()).toBe(COLOR_POR_ESTADO[estado].claro.toUpperCase())

      const matchesOscuros = [...contenidoCss.matchAll(new RegExp(`--color-estado-${sufijo}:\\s*(#[0-9a-fA-F]{6})`, 'g'))]
      expect(matchesOscuros.length).toBeGreaterThanOrEqual(2)
      const tokenOscuroEncontrado = matchesOscuros[matchesOscuros.length - 1][1]
      expect(tokenOscuroEncontrado.toUpperCase()).toBe(COLOR_POR_ESTADO[estado].oscuro.toUpperCase())
    }
  })

  it('cada color de estado debe cumplir contraste WCAG AA (>= 4.5:1) sobre la superficie de su tema', () => {
    const SUPERFICIE_CLARA = '#fbfdfc'
    const SUPERFICIE_OSCURA = '#0c2830'

    for (const [estado, config] of Object.entries(COLOR_POR_ESTADO) as [EstadoServicio, typeof COLOR_POR_ESTADO[EstadoServicio]][]) {
      const contrasteClaro = calcularContraste(config.claro, SUPERFICIE_CLARA)
      expect(
        contrasteClaro,
        `Contraste de ${estado} (${config.claro}) sobre superficie clara (${SUPERFICIE_CLARA}) es ${contrasteClaro.toFixed(2)}:1 (< 4.5:1)`
      ).toBeGreaterThanOrEqual(4.5)

      const contrasteOscuro = calcularContraste(config.oscuro, SUPERFICIE_OSCURA)
      expect(
        contrasteOscuro,
        `Contraste de ${estado} (${config.oscuro}) sobre superficie oscura (${SUPERFICIE_OSCURA}) es ${contrasteOscuro.toFixed(2)}:1 (< 4.5:1)`
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
})
