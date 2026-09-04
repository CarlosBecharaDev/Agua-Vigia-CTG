/**
 * CarruselSector — transición entre los contenidos del panel lateral (las 4 tarjetas de
 * estado, el buscador de barrios, la ficha del sector elegido), inspirada en el
 * deslizamiento con inclinación 3D de reactbits.dev (Components → Carousel): mismo resorte
 * (`stiffness: 300, damping: 30`) y el mismo giro en `rotateY` de sus tarjetas al desplazarse,
 * adaptado de un carrusel arrastrable de N ítems a un swap controlado por estado — acá no hay
 * arrastre, cada cambio de `vista` dispara la misma transición.
 *
 * El llamador indica la dirección según la acción del usuario. Así el componente no necesita
 * mutar referencias durante el render ni inventar un orden implícito entre vistas.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { FC, ReactNode } from 'react'

const RESORTE = { type: 'spring' as const, stiffness: 300, damping: 30 }

const variantes = {
  entra: (direccion: number) => ({
    x: direccion > 0 ? 32 : -32,
    rotateY: direccion > 0 ? 26 : -26,
    opacity: 0,
  }),
  centro: { x: 0, rotateY: 0, opacity: 1 },
  sale: (direccion: number) => ({
    x: direccion > 0 ? -32 : 32,
    rotateY: direccion > 0 ? -26 : 26,
    opacity: 0,
  }),
}

function usePrefiereMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const medio = window.matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = () => setReducido(medio.matches)
    medio.addEventListener('change', alCambiar)
    return () => medio.removeEventListener('change', alCambiar)
  }, [])
  return reducido
}

interface Props {
  /** Identifica el contenido actual — cambiar el valor dispara la transición. */
  vista: string
  /** Sentido decidido por la acción que originó el cambio: 1 adelante, -1 atrás. */
  direccion: number
  children: ReactNode
  className?: string
}

export const CarruselSector: FC<Props> = ({ vista, direccion, children, className }) => {
  const reducido = usePrefiereMovimientoReducido()
  const transicion = reducido ? { duration: 0 } : RESORTE

  return (
    <motion.div className={className} layout={!reducido} transition={transicion} style={{ perspective: 900 }}>
      <AnimatePresence mode="popLayout" custom={direccion} initial={false}>
        <motion.div
          key={vista}
          custom={direccion}
          variants={reducido ? undefined : variantes}
          initial="entra"
          animate="centro"
          exit="sale"
          transition={transicion}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
