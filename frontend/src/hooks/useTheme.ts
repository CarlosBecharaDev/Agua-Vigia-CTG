/**
 * useTheme — hook para gestionar el tema claro/oscuro.
 *
 * Implementa la lógica de DESIGN.md §3:
 * - Por defecto respeta `prefers-color-scheme`.
 * - El interruptor del usuario (data-theme en :root) gana en las dos direcciones.
 * - La preferencia se persiste en localStorage para sobrevivir recargas.
 */
import { useEffect, useState } from 'react'

type Tema = 'claro' | 'oscuro'

const CLAVE_STORAGE = 'aguavigia-tema'

function getTemaInicial(): Tema | null {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE)
    if (guardado === 'claro' || guardado === 'oscuro') return guardado
  } catch {
    // localStorage no disponible (modo privado restringido, etc.)
  }
  return null
}

export function useTheme() {
  const [tema, setTema] = useState<Tema | null>(getTemaInicial)

  useEffect(() => {
    const raiz = document.documentElement

    if (tema === null) {
      // Sin preferencia guardada: deja que el CSS responda al SO
      raiz.removeAttribute('data-theme')
    } else {
      raiz.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark')
      try {
        localStorage.setItem(CLAVE_STORAGE, tema)
      } catch {
        // Silencioso: el tema funciona aunque no persista
      }
    }
  }, [tema])

  /** Alterna entre claro y oscuro, partiendo del estado actual del SO si no hay preferencia. */
  function alternarTema() {
    setTema((prev) => {
      if (prev !== null) return prev === 'claro' ? 'oscuro' : 'claro'
      // Primera vez: detecta el SO y alterna desde ahí
      const osSiOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
      return osSiOscuro ? 'claro' : 'oscuro'
    })
  }

  /** El tema activo que se debe renderizar, considerando el SO cuando no hay preferencia. */
  const temaActivo: Tema = tema !== null
    ? tema
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro'

  return { tema, temaActivo, alternarTema }
}
