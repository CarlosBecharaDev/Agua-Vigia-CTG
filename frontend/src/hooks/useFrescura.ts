/**
 * useFrescura.ts — Calcula hace cuánto se actualizó un dato.
 *
 * DESIGN.md §6: "Frescura siempre visible. Cada sector muestra
 * 'actualizado hace X'. Si una fuente lleva horas muda, se marca
 * como degradada."
 */
import { useState, useEffect } from 'react'
import { MINUTOS_FRESCURA } from '../types/tipos-dominio'

interface ResultadoFrescura {
  etiqueta: string      // "actualizado hace 3 min"
  degradado: boolean    // true si supera MINUTOS_FRESCURA
}

export function useFrescura(timestampIso: string | null): ResultadoFrescura {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!timestampIso) {
    return { etiqueta: 'sin datos', degradado: true }
  }

  const hace = ahora - new Date(timestampIso).getTime()
  const minutos = Math.floor(hace / 60_000)
  const degradado = minutos >= MINUTOS_FRESCURA

  let etiqueta: string
  if (minutos < 1)        etiqueta = 'actualizado ahora'
  else if (minutos === 1) etiqueta = 'actualizado hace 1 min'
  else if (minutos < 60)  etiqueta = `actualizado hace ${minutos} min`
  else {
    const horas = Math.floor(minutos / 60)
    etiqueta = horas === 1 ? 'actualizado hace 1 hora' : `actualizado hace ${horas} horas`
  }

  return { etiqueta, degradado }
}
