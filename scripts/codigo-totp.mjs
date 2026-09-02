#!/usr/bin/env node
/**
 * Genera el código de 6 dígitos del segundo factor **para desarrollo local**, sin necesidad de
 * instalar una app de autenticación.
 *
 * Por qué existe: el panel exige TOTP al rol ADMIN (`ADR-039`), y la pantalla de alta muestra el
 * secreto en texto además del QR. Quien desarrolla en su máquina no siempre tiene un teléfono con
 * Google Authenticator a mano, y sin código no hay forma de entrar al panel ni de probarlo.
 *
 * Esto no rodea el segundo factor: hace exactamente lo mismo que la app, con el mismo estándar
 * (RFC 6238, HMAC-SHA1, 6 dígitos, franjas de 30 s) y sobre un secreto que la propia pantalla te
 * acaba de entregar. Es una calculadora, no una llave maestra.
 *
 * ⚠️ Solo para cuentas de desarrollo. Un secreto de producción tecleado aquí queda en el historial
 * del shell, que es justo donde no debe estar: para eso usa una app o un gestor de contraseñas.
 *
 *   node scripts/codigo-totp.mjs GEZDGNBVGY3TQOJQ     # el secreto que muestra la pantalla de alta
 *   node scripts/codigo-totp.mjs --autoprueba          # vectores del RFC 6238
 */
import { createHmac } from 'node:crypto'

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DIGITOS = 6
const SEGUNDOS_POR_FRANJA = 30

/** Espejo de `Base32.decodificar` del backend: RFC 4648, sin relleno y tolerante a espacios. */
function decodificarBase32(secreto) {
  const limpio = secreto.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase()
  if (!limpio || [...limpio].some((c) => !ALFABETO.includes(c))) {
    throw new Error(`«${secreto}» no es Base32 válido: solo A–Z y 2–7.`)
  }

  const bytes = []
  let acumulador = 0
  let bits = 0
  for (const caracter of limpio) {
    acumulador = (acumulador << 5) | ALFABETO.indexOf(caracter)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((acumulador >>> bits) & 0xff)
    }
  }
  return Buffer.from(bytes)
}

/** Truncamiento dinámico del RFC 6238, igual que `TotpAdapter.calcular`. */
export function codigoTotp(secreto, epochSegundos = Math.floor(Date.now() / 1000)) {
  const franja = Buffer.alloc(8)
  franja.writeBigInt64BE(BigInt(Math.floor(epochSegundos / SEGUNDOS_POR_FRANJA)))

  const hash = createHmac('sha1', decodificarBase32(secreto)).update(franja).digest()
  const desplazamiento = hash[hash.length - 1] & 0x0f
  const binario =
    ((hash[desplazamiento] & 0x7f) << 24) |
    ((hash[desplazamiento + 1] & 0xff) << 16) |
    ((hash[desplazamiento + 2] & 0xff) << 8) |
    (hash[desplazamiento + 3] & 0xff)

  return String(binario % 10 ** DIGITOS).padStart(DIGITOS, '0')
}

/**
 * Vectores del propio RFC 6238 (semilla ASCII "12345678901234567890"). Si esto pasa, el código que
 * genera este archivo es el mismo que generaría cualquier app — y el que espera el backend.
 */
function autoprueba() {
  const SEMILLA = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
  const casos = [
    [59, '287082'],
    [1111111109, '081804'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ]

  let fallos = 0
  for (const [instante, esperado] of casos) {
    const obtenido = codigoTotp(SEMILLA, instante)
    const bien = obtenido === esperado
    if (!bien) fallos++
    console.log(`${bien ? 'OK  ' : 'FALLA'} t=${instante} → ${obtenido} (esperado ${esperado})`)
  }
  if (fallos > 0) {
    console.error(`\n${fallos} vector(es) del RFC 6238 no coinciden.`)
    process.exit(1)
  }
  console.log('\nLos 4 vectores del RFC 6238 coinciden.')
}

const argumento = process.argv[2]

if (argumento === '--autoprueba') {
  autoprueba()
} else if (!argumento) {
  console.error('Uso: node scripts/codigo-totp.mjs <SECRETO_BASE32>')
  console.error('     node scripts/codigo-totp.mjs --autoprueba')
  process.exit(1)
} else {
  const restantes = SEGUNDOS_POR_FRANJA - (Math.floor(Date.now() / 1000) % SEGUNDOS_POR_FRANJA)
  console.log(codigoTotp(argumento))
  console.error(`(vale ${restantes} s más; el backend acepta además el código de la franja anterior)`)
}
