/**
 * GooeyNav — enlaces del navbar con la píldora líquida de reactbits.dev
 * (Components → Gooey Nav). Shader de partículas y animaciones idénticos al original.
 *
 * Dos cambios respecto al original, ambos obligados por cómo funciona esta página:
 *
 * 1. El índice activo es CONTROLADO (prop `activeIndex`), no estado interno. En la página
 *    principal la sección activa la decide un IntersectionObserver mientras el usuario hace
 *    scroll (ver PaginaMapa), así que el navbar tiene que poder reaccionar a algo que no es
 *    un click. Las partículas solo se disparan en el click, no cuando el scroll mueve la
 *    píldora — si no, el efecto se dispararía solo al pasar por cada sección.
 *
 * 2. La navegación la resuelve el padre vía `onSelect`, porque tres de los cuatro destinos
 *    son anclas de la misma página (`/#bitacora`) y uno es otra ruta (`/veedor`): el <a>
 *    conserva su href real para clic-derecho y accesibilidad, pero el click lo intercepta
 *    react-router.
 */
import { useRef, useEffect } from 'react'
import type { FC, MouseEvent, KeyboardEvent } from 'react'
import './GooeyNav.css'

export interface GooeyNavItem {
  label: string
  href: string
}

// Id fijo, no useId(): esta barra es única en la app y los ids que genera React llevan
// caracteres que hay que escapar dentro de url(#...) en CSS.
const FILTRO_GOO = 'gooey-nav-goo'

interface Props {
  items: GooeyNavItem[]
  activeIndex: number
  onSelect: (index: number, href: string) => void
  animationTime?: number
  particleCount?: number
  particleDistances?: [number, number]
  particleR?: number
  timeVariance?: number
  colors?: number[]
}

export const GooeyNav: FC<Props> = ({
  items,
  activeIndex,
  onSelect,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLUListElement>(null)
  const filterRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  const noise = (n = 1) => n / 2 - Math.random() * n

  const getXY = (distance: number, pointIndex: number, totalPoints: number): [number, number] => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180)
    return [distance * Math.cos(angle), distance * Math.sin(angle)]
  }

  const createParticle = (i: number, t: number, d: [number, number], r: number) => {
    const rotate = noise(r / 10)
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    }
  }

  const makeParticles = (element: HTMLElement): void => {
    const d = particleDistances
    const r = particleR
    const bubbleTime = animationTime * 2 + timeVariance
    element.style.setProperty('--time', `${bubbleTime}ms`)

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2)
      const p = createParticle(i, t, d, r)
      element.classList.remove('active')

      setTimeout(() => {
        const particle = document.createElement('span')
        const point = document.createElement('span')
        particle.classList.add('particle')
        particle.style.setProperty('--start-x', `${p.start[0]}px`)
        particle.style.setProperty('--start-y', `${p.start[1]}px`)
        particle.style.setProperty('--end-x', `${p.end[0]}px`)
        particle.style.setProperty('--end-y', `${p.end[1]}px`)
        particle.style.setProperty('--time', `${p.time}ms`)
        particle.style.setProperty('--scale', `${p.scale}`)
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`)
        particle.style.setProperty('--rotate', `${p.rotate}deg`)

        point.classList.add('point')
        particle.appendChild(point)
        element.appendChild(particle)
        requestAnimationFrame(() => {
          element.classList.add('active')
        })
        setTimeout(() => {
          try {
            element.removeChild(particle)
          } catch {
            // La partícula ya se retiró en un click posterior; nada que hacer.
          }
        }, t)
      }, 30)
    }
  }

  const updateEffectPosition = (element: HTMLElement): void => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const pos = element.getBoundingClientRect()

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    }
    Object.assign(filterRef.current.style, styles)
    Object.assign(textRef.current.style, styles)
    textRef.current.innerText = element.innerText
  }

  const dispararEfecto = (index: number): void => {
    const li = navRef.current?.querySelectorAll('li')[index] as HTMLElement | undefined
    if (!li) return
    updateEffectPosition(li)

    if (filterRef.current) {
      filterRef.current.querySelectorAll('.particle').forEach((p) => p.remove())
    }
    if (textRef.current) {
      textRef.current.classList.remove('active')
      void textRef.current.offsetWidth
      textRef.current.classList.add('active')
    }
    if (filterRef.current) {
      makeParticles(filterRef.current)
    }
  }

  const alHacerClick = (e: MouseEvent<HTMLAnchorElement>, index: number, href: string): void => {
    e.preventDefault()
    if (index !== activeIndex) dispararEfecto(index)
    onSelect(index, href)
  }

  const alPresionarTecla = (e: KeyboardEvent<HTMLAnchorElement>, index: number, href: string): void => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (index !== activeIndex) dispararEfecto(index)
    onSelect(index, href)
  }

  // Reposiciona la píldora cuando el índice cambia por scroll (sin partículas) y cuando el
  // contenedor cambia de tamaño. Es el mismo efecto del original, con la salvedad de que
  // aquí `activeIndex` puede venir de fuera.
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return
    const activeLi = navRef.current.querySelectorAll('li')[activeIndex] as HTMLElement | undefined
    if (activeLi) {
      updateEffectPosition(activeLi)
      textRef.current?.classList.add('active')
    }

    const ro = new ResizeObserver(() => {
      const li = navRef.current?.querySelectorAll('li')[activeIndex] as HTMLElement | undefined
      if (li) updateEffectPosition(li)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      {/* El original consigue el "goteo" con blur+contrast sobre un rectángulo NEGRO y
          mix-blend-mode:lighten. Ese truco exige que detrás haya un fondo opaco oscuro:
          "lighten" solo vuelve invisible al negro si el fondo es opaco. Como el navbar es
          de vidrio translúcido, el negro se colaba como un recuadro sucio.
          Este filtro hace lo mismo pero umbralizando el canal ALFA (la última fila de la
          matriz), así que funciona sobre cualquier fondo y sin modo de mezcla. */}
      <svg aria-hidden="true" focusable="false" className="gooey-nav-defs">
        <defs>
          <filter id={FILTRO_GOO}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="desenfoque" />
            <feColorMatrix
              in="desenfoque"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 24 -12"
            />
          </filter>
        </defs>
      </svg>

      <nav aria-label="Navegación principal">
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={item.href} className={activeIndex === index ? 'active' : ''}>
              <a
                href={item.href}
                aria-current={activeIndex === index ? 'page' : undefined}
                onClick={(e) => alHacerClick(e, index, item.href)}
                onKeyDown={(e) => alPresionarTecla(e, index, item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} aria-hidden="true" />
      <span className="effect text" ref={textRef} aria-hidden="true" />
    </div>
  )
}
