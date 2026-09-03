/**
 * useConsultaMedios — suscribe un componente a una media query.
 *
 * Existe para decidir en JS, y no solo con CSS, qué se monta en cada tamaño de pantalla:
 * cuando la versión de escritorio y la de teléfono son dos árboles distintos (y no el mismo
 * con otro estilo), dejarlos a los dos en el DOM y esconder uno con `display: none` duplica
 * encabezados y enlaces para quien navega con lector de pantalla.
 *
 * La cadena que se pasa tiene que coincidir con el corte equivalente en index.css. Los dos
 * que se usan hoy: `(max-width: 768px)` para la navegación y `(max-width: 1024px)` para el
 * panel de bienvenida.
 */
import { useEffect, useState } from 'react'

export const useConsultaMedios = (consulta: string): boolean => {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(consulta).matches
  )

  useEffect(() => {
    const medio = window.matchMedia(consulta)
    const alCambiar = () => setCoincide(medio.matches)
    alCambiar()
    medio.addEventListener('change', alCambiar)
    return () => medio.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
