/**
 * CarruselSector — transición entre los contenidos del panel lateral (las 4 tarjetas de
 * estado, el buscador de barrios, la ficha del sector elegido), inspirada en el
 * deslizamiento con inclinación 3D de reactbits.dev (Components → Carousel): mismo resorte
 * (`stiffness: 300, damping: 30`) y el mismo giro en `rotateY` de sus tarjetas al desplazarse,
 * adaptado de un carrusel arrastrable de N ítems a un swap controlado por estado — acá no hay
 * arrastre, cada cambio de `vista` dispara la misma transición.
 *
 * La dirección no la fija el llamador: se infiere sola. La primera vez que aparece una
 * `vista` se le asigna la siguiente casilla libre (0, 1, 2…) en el orden en que el usuario
 * fue llegando a ella — no un orden fijo de antemano. Ir a una casilla mayor gira hacia
 * adelante, a una menor gira hacia atrás. Con "estado" (primera en aparecer, casilla 0),
 * "sector" (casilla 1) y "detalle" (casilla 2, se llega a ella desde cualquiera de las
 * otras dos) el resultado es intuitivo: alternar entre pestañas siempre desliza para el
 * mismo lado, y entrar al detalle siempre gira hacia adelante venga de donde venga.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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

/** Asigna a cada `vista` distinta la próxima casilla libre, en el orden en que se pide por
 *  primera vez, y devuelve la dirección al compararla con la última consultada. */
function useDireccionCarrusel(vista: string): number {
  const casillasRef = useRef(new Map<string, number>())
  const siguienteCasillaRef = useRef(0)
  const anteriorRef = useRef(vista)

  if (!casillasRef.current.has(vista)) {
    casillasRef.current.set(vista, siguienteCasillaRef.current)
    siguienteCasillaRef.current += 1
  }

  const casillaActual = casillasRef.current.get(vista)!
  const casillaAnterior = casillasRef.current.get(anteriorRef.current)!
  const direccion = casillaActual === casillaAnterior ? 1 : Math.sign(casillaActual - casillaAnterior)

  useEffect(() => {
    anteriorRef.current = vista
  }, [vista])

  return direccion
}

interface Props {
  /** Identifica el contenido actual — cambiar el valor dispara la transición. */
  vista: string
  children: ReactNode
  className?: string
}

export const CarruselSector: FC<Props> = ({ vista, children, className }) => {
  const reducido = usePrefiereMovimientoReducido()
  const direccion = useDireccionCarrusel(vista)
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
