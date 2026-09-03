/**
 * NavegacionInferior — barra de pestañas al pie, SOLO en teléfono (≤768px).
 *
 * En pantalla ancha la navegación de la página principal sigue siendo el riel del navbar
 * superior (GooeyNav, ver NavegacionFlotante) y esto no se monta. Abajo del todo porque en
 * el navbar superior no cabía: las cuatro etiquetas desbordaban la píldora y quedaba una
 * sola visible, con la píldora activa recortada por la mitad.
 *
 * El indicador es UNA sola figura estirable —"la luz"— que viaja por la barra: un ANILLO
 * cuando está posada sobre una pestaña, y una BARRA recta de extremos redondeados mientras
 * va de una a otra. Las dos formas son la misma cápsula (cuando los extremos coinciden, los
 * dos arcos cierran un círculo), así que nunca queda un cabo suelto a mitad de camino.
 *
 * Se puede tocar una pestaña o arrastrar la luz a lo largo de la barra.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FC, PointerEvent as EventoPuntero } from 'react'
import type { EnlaceNav } from '../../config/navegacion'
import './NavegacionInferior.css'

interface Props {
  items: EnlaceNav[]
  activeIndex: number
  onSelect: (indice: number, href: string) => void
}

const RADIO_ANILLO = 18
const GROSOR_BASE = 2
const GROSOR_EXTRA = 1.9
const APERTURA_MAXIMA = 150
const K_CABEZA = 260
const C_CABEZA = 26
const K_COLA_MIN = 70
const K_COLA_MAX = 380
const C_COLA = 24
const VIAJE_REF = 110
const UMBRAL_ARRASTRE = 6

/** Cápsula de extremos redondeados entre `x0` y `x1`. Con x0 === x1 los dos arcos cierran
 *  un círculo perfecto: es la misma `d` para el anillo y para la barra. */
const capsula = (x0: number, x1: number, cy: number, r: number) => {
  const a = x0.toFixed(2)
  const b = x1.toFixed(2)
  const arriba = (cy - r).toFixed(2)
  const abajo = (cy + r).toFixed(2)
  return `M ${a} ${arriba} H ${b} A ${r} ${r} 0 0 1 ${b} ${abajo} H ${a} A ${r} ${r} 0 0 1 ${a} ${arriba} Z`
}

export const NavegacionInferior: FC<Props> = ({ items, activeIndex, onSelect }) => {
  const refBarra = useRef<HTMLElement>(null)
  const refLuz = useRef<SVGPathElement>(null)
  const refsIcono = useRef<Array<HTMLSpanElement | null>>([])

  const [geo, setGeo] = useState({ ancho: 0, alto: 0, medida: false })
  const geoRef = useRef({ centros: [] as number[], cy: 0 })
  const [indiceArrastre, setIndiceArrastre] = useState<number | null>(null)

  const [reducido, setReducido] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  useEffect(() => {
    const medio = window.matchMedia('(prefers-reduced-motion: reduce)')
    const alCambiar = () => setReducido(medio.matches)
    medio.addEventListener('change', alCambiar)
    return () => medio.removeEventListener('change', alCambiar)
  }, [])

  // Un objeto mutable y no estado: esto cambia en cada cuadro y re-renderizar React 60 veces
  // por segundo para mover una `d` de SVG sería tirar el presupuesto de un gama media
  // (DESIGN.md §8). El bucle escribe el atributo directamente sobre el nodo.
  const anim = useRef({ cabeza: 0, cola: 0, vCabeza: 0, vCola: 0, objetivo: 0, previo: 0, raf: 0 })
  const montado = useRef(false)

  const pintar = useCallback(() => {
    const { cy } = geoRef.current
    const { cabeza, cola } = anim.current
    const x0 = Math.min(cabeza, cola)
    const x1 = Math.max(cabeza, cola)
    const luz = refLuz.current
    if (luz) {
      luz.setAttribute('d', capsula(x0, x1, cy, RADIO_ANILLO))
      // Un trazo de peso constante estirado sobre el triple de recorrido se LEE más tenue
      // justo cuando más está haciendo. El grosor sube con la apertura para compensarlo.
      const apertura = Math.min((x1 - x0) / APERTURA_MAXIMA, 1)
      luz.setAttribute('stroke-width', (GROSOR_BASE + apertura * GROSOR_EXTRA).toFixed(2))
    }
  }, [])

  const paso = useCallback(
    (ahora: number) => {
      const a = anim.current
      let dt = Math.min((ahora - a.previo) / 1000, 1 / 30)
      a.previo = ahora
      // Subpasos fijos: con un solo paso del tamaño del cuadro, el mismo resorte rebota
      // distinto en una pantalla de 60Hz que en una de 120Hz.
      while (dt > 0) {
        const h = Math.min(dt, 1 / 240)
        dt -= h
        const dCabeza = a.objetivo - a.cabeza
        a.vCabeza += (K_CABEZA * dCabeza - C_CABEZA * a.vCabeza) * h
        a.cabeza += a.vCabeza * h
        // La cola va suelta mientras quede viaje por delante y se endurece cuando la cabeza
        // ya aterrizó: eso es lo que abre la barra al salir y la cierra en anillo al llegar.
        // El criterio es la distancia que falta, no la velocidad — en el rebote la velocidad
        // pasa por cero justo donde la figura todavía tiene que seguir estirada.
        const falta = Math.min(1, Math.abs(dCabeza) / VIAJE_REF)
        const kCola = K_COLA_MIN + (K_COLA_MAX - K_COLA_MIN) * (1 - falta) ** 2
        const dCola = a.objetivo - a.cola
        a.vCola += (kCola * dCola - C_COLA * a.vCola) * h
        a.cola += a.vCola * h
      }
      pintar()

      const quieto =
        Math.abs(a.objetivo - a.cabeza) < 0.15 &&
        Math.abs(a.objetivo - a.cola) < 0.15 &&
        Math.abs(a.vCabeza) < 1 &&
        Math.abs(a.vCola) < 1
      if (quieto) {
        a.cabeza = a.objetivo
        a.cola = a.objetivo
        a.vCabeza = 0
        a.vCola = 0
        a.raf = 0
        pintar()
        return
      }
      a.raf = requestAnimationFrame(paso)
    },
    [pintar]
  )

  const arrancar = useCallback(() => {
    const a = anim.current
    if (a.raf) return
    a.previo = performance.now()
    a.raf = requestAnimationFrame(paso)
  }, [paso])

  const apuntar = useCallback(
    (x: number, animar: boolean) => {
      const a = anim.current
      a.objetivo = x
      if (animar) {
        arrancar()
        return
      }
      if (a.raf) {
        cancelAnimationFrame(a.raf)
        a.raf = 0
      }
      a.cabeza = x
      a.cola = x
      a.vCabeza = 0
      a.vCola = 0
      pintar()
    },
    [arrancar, pintar]
  )

  useEffect(() => () => { if (anim.current.raf) cancelAnimationFrame(anim.current.raf) }, [])

  useLayoutEffect(() => {
    const medir = () => {
      const barra = refBarra.current
      if (!barra) return
      const caja = barra.getBoundingClientRect()
      const centros: number[] = []
      let cy = caja.height / 2
      refsIcono.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        centros[i] = r.left - caja.left + r.width / 2
        cy = r.top - caja.top + r.height / 2
      })
      geoRef.current = { centros, cy }
      setGeo((previa) =>
        previa.medida && Math.abs(previa.ancho - caja.width) < 0.5 && Math.abs(previa.alto - caja.height) < 0.5
          ? previa
          : { ancho: caja.width, alto: caja.height, medida: true }
      )
    }

    medir()
    const observador = new ResizeObserver(medir)
    if (refBarra.current) observador.observe(refBarra.current)
    return () => observador.disconnect()
  }, [items.length])

  const arrastre = useRef({ activo: false, x0: 0, y0: 0, id: -1, movido: false })
  const tragarClick = useRef(false)

  const indiceMasCercano = useCallback((x: number) => {
    const { centros } = geoRef.current
    let mejor = 0
    let dist = Infinity
    centros.forEach((c, i) => {
      const d = Math.abs(c - x)
      if (d < dist) {
        dist = d
        mejor = i
      }
    })
    return mejor
  }, [])

  // Coloca la luz donde toca cada vez que cambia la sección activa (por toque, por arrastre
  // o porque el usuario bajó con el dedo y el observador de scroll cambió de sección). El
  // primer posicionamiento no se anima: si no, la luz entraría volando desde el borde.
  useEffect(() => {
    if (!geo.medida || arrastre.current.activo) return
    const x = geoRef.current.centros[activeIndex]
    if (x === undefined) return
    apuntar(x, montado.current && !reducido)
    montado.current = true
  }, [activeIndex, geo, apuntar, reducido])

  const alBajar = (e: EventoPuntero<HTMLElement>) => {
    tragarClick.current = false
    if (reducido) return
    arrastre.current = { activo: false, x0: e.clientX, y0: e.clientY, id: e.pointerId, movido: false }
  }

  const alMover = (e: EventoPuntero<HTMLElement>) => {
    const d = arrastre.current
    if (d.id !== e.pointerId) return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    if (!d.activo) {
      // Solo se toma el gesto si es claramente horizontal: en vertical manda el scroll.
      if (Math.abs(dx) < UMBRAL_ARRASTRE || Math.abs(dx) <= Math.abs(dy)) return
      d.activo = true
      d.movido = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const barra = refBarra.current
    if (!barra) return
    const { centros } = geoRef.current
    if (centros.length === 0) return
    const caja = barra.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - caja.left, centros[0]), centros[centros.length - 1])
    anim.current.objetivo = x
    arrancar()
    const cercano = indiceMasCercano(x)
    setIndiceArrastre((n) => (n === cercano ? n : cercano))
  }

  const alSoltar = (e: EventoPuntero<HTMLElement>) => {
    const d = arrastre.current
    if (d.id !== e.pointerId) return
    arrastre.current = { ...d, activo: false, id: -1 }
    setIndiceArrastre(null)
    if (!d.movido) return // Fue un toque limpio: lo resuelve el onClick del botón.
    tragarClick.current = true
    const cercano = indiceMasCercano(anim.current.objetivo)
    apuntar(geoRef.current.centros[cercano] ?? anim.current.objetivo, true)
    if (cercano !== activeIndex) onSelect(cercano, items[cercano].a)
  }

  const alCancelar = (e: EventoPuntero<HTMLElement>) => {
    if (arrastre.current.id !== e.pointerId) return
    arrastre.current = { activo: false, x0: 0, y0: 0, id: -1, movido: false }
    setIndiceArrastre(null)
    const x = geoRef.current.centros[activeIndex]
    if (x !== undefined) apuntar(x, !reducido)
  }

  const resaltado = indiceArrastre ?? activeIndex

  return (
    <nav
      ref={refBarra}
      className="nav-inferior"
      aria-label="Secciones de la página"
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alCancelar}
    >
      {geo.medida && (
        <svg
          className="nav-inferior-luz"
          width={geo.ancho}
          height={geo.alto}
          viewBox={`0 0 ${geo.ancho} ${geo.alto}`}
          aria-hidden="true"
          focusable="false"
        >
          <path ref={refLuz} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <ul className="nav-inferior-lista">
        {items.map((item, i) => {
          const Icono = item.Icono
          return (
            <li key={item.a}>
              <button
                type="button"
                className={`nav-inferior-pestana${i === resaltado ? ' nav-inferior-pestana--activa' : ''}`}
                aria-current={i === activeIndex ? 'page' : undefined}
                onClick={() => {
                  if (tragarClick.current) {
                    tragarClick.current = false
                    return
                  }
                  onSelect(i, item.a)
                }}
              >
                <span
                  className="nav-inferior-icono"
                  ref={(el) => {
                    refsIcono.current[i] = el
                  }}
                >
                  <Icono size={19} aria-hidden="true" />
                </span>
                <span className="nav-inferior-etiqueta">{item.etiqueta}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
