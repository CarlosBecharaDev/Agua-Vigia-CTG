const CLAVE_HUELLA = 'aguavigia_huella_dispositivo_v1'

let semillaDeSesion: string | null = null

function nuevaSemilla(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()

  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function obtenerSemilla(): string {
  try {
    const guardada = localStorage.getItem(CLAVE_HUELLA)
    if (guardada) return guardada

    const creada = nuevaSemilla()
    localStorage.setItem(CLAVE_HUELLA, creada)
    return creada
  } catch {
    semillaDeSesion ??= nuevaSemilla()
    return semillaDeSesion
  }
}

/**
 * Identificador anónimo y estable usado para aplicar RF006 sin crear una cuenta.
 * La semilla aleatoria nunca sale del navegador: el backend recibe únicamente su SHA-256.
 */
export async function obtenerHuellaDispositivo(): Promise<string> {
  const semilla = obtenerSemilla()
  const bytes = new TextEncoder().encode(semilla)
  const resumen = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(resumen), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
