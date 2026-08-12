/**
 * SeccionBitacora — M8 (Bitácora pública - UI), integrada en la página principal.
 *
 * Vivía en su propia ruta (/bitacora); ahora es una sección de "/" a la que se llega
 * haciendo scroll (o navegando a "/#bitacora" desde cualquier otra página — ver
 * PaginaMapa, que escucha el hash y hace scroll hasta acá).
 *
 * Carrusel horizontal de tarjetas: se desplaza solo hacia la derecha en bucle continuo
 * mientras nadie lo toca (arrastre, scroll, foco por teclado) — apenas el usuario
 * interactúa, se detiene, y retoma el auto-scroll unos segundos después de soltarlo.
 * Respeta prefers-reduced-motion (sin auto-scroll ahí; el usuario sigue pudiendo
 * desplazarlo a mano).
 *
 * Conectada al backend real: GET /api/bitacora (M8, público, sin auth, de solo anexado).
 * No hay datos de demostración — si el backend no responde, se muestra el error tal cual.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FC, PointerEvent as ReactPointerEvent } from 'react'
import { listarBitacora } from '../api/services'
import type { EventoBitacora, TipoEventoBitacora } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import { RefreshCw, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

// La bitácora clasifica por tipo de evento (CORTE_ANUNCIADO/CONFIRMADO/RESTABLECIDO), no por
// el estado de un sector — se reutiliza la misma paleta de EstadoServicio para no inventar
// una segunda escala de colores (DESIGN.md §2: el color siempre significa lo mismo).
const ESTADO_POR_TIPO: Record<TipoEventoBitacora, EstadoServicio> = {
  CORTE_ANUNCIADO: 'CORTE_PROGRAMADO',
  CORTE_CONFIRMADO_POR_CIUDADANOS: 'SIN_SERVICIO',
  CORTE_RESTABLECIDO: 'CON_SERVICIO',
}

const FILTROS: { valor: 'TODOS' | EstadoServicio; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'SIN_SERVICIO', etiqueta: 'Sin servicio' },
  { valor: 'CORTE_PROGRAMADO', etiqueta: 'Programados' },
  { valor: 'CON_SERVICIO', etiqueta: 'Restablecidos' },
]

interface ItemBitacora {
  id: string
  titulo: string
  fecha: string
  estado: EstadoServicio
}

const ICONO_POR_ESTADO: Record<EstadoServicio, typeof AlertTriangle> = {
  SIN_SERVICIO: AlertTriangle,
  CORTE_PROGRAMADO: Info,
  CON_SERVICIO: CheckCircle2,
  PRESION_BAJA: AlertTriangle,
}

const formatearFecha = (isoString: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoString))

// ── Borde con brillo direccional (adaptado de "Border Glow", reactbits.dev, a las variables
//    de tema del proyecto) — el brillo aparece en el punto del borde más cercano al cursor y
//    se apaga hacia el centro. Solo dos variables CSS por tarjeta (--proximidad-borde,
//    --angulo-cursor); el color lo fija cada tarjeta según su estado (SIN_SERVICIO/etc.), así
//    el "halo" refuerza el mismo color que ya usa el ícono y la etiqueta, no uno genérico. ──
function calcularBrilloBorde(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect()
  const x = clientX - r.left
  const y = clientY - r.top
  const cx = r.width / 2
  const cy = r.height / 2
  const dx = x - cx
  const dy = y - cy
  const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity
  const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity
  const proximidad = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)
  let angulo = Math.atan2(dy, dx) * (180 / Math.PI) + 90
  if (angulo < 0) angulo += 360
  el.style.setProperty('--proximidad-borde', proximidad.toFixed(3))
  el.style.setProperty('--angulo-cursor', `${angulo.toFixed(1)}deg`)
}

interface Props {
  /** Texto del buscador de la navbar (NavegacionFlotante) — filtra por título, además del filtro de estado. */
  busqueda?: string
}

function aItemBitacora(evento: EventoBitacora): ItemBitacora {
  return {
    id: evento.id,
    titulo: evento.descripcion,
    fecha: evento.timestamp,
    estado: ESTADO_POR_TIPO[evento.tipo as TipoEventoBitacora] ?? 'CORTE_PROGRAMADO',
  }
}

export const SeccionBitacora: FC<Props> = ({ busqueda = '' }) => {
  const [items, setItems] = useState<ItemBitacora[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | EstadoServicio>('TODOS')

  const cargarEventos = useCallback(async () => {
    setCargando(true)
    try {
      const eventos = await listarBitacora(20)
      setItems(eventos.map(aItemBitacora))
      setError(null)
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarEventos()
  }, [cargarEventos])

  const itemsFiltrados = useMemo(() => {
    const porEstado = filtro === 'TODOS' ? items : items.filter((i) => i.estado === filtro)
    const termino = busqueda.trim().toLowerCase()
    return termino ? porEstado.filter((i) => i.titulo.toLowerCase().includes(termino)) : porEstado
  }, [items, filtro, busqueda])
  // Duplicado para el bucle sin costura del carrusel — ver useEffect de auto-scroll.
  const itemsCarrusel = itemsFiltrados.length > 1 ? [...itemsFiltrados, ...itemsFiltrados] : itemsFiltrados

  // ── Auto-scroll continuo hacia la derecha, en bucle, pausado mientras el usuario
  //    interactúa (arrastre, scroll, hover, foco por teclado) o si prefiere menos
  //    movimiento. ──
  const carruselRef = useRef<HTMLDivElement>(null)
  const interactuandoRef = useRef(false)
  const arrastreRef = useRef<{ activo: boolean; inicioX: number; inicioScroll: number; movio: boolean }>({
    activo: false, inicioX: 0, inicioScroll: 0, movio: false,
  })
  const [arrastrando, setArrastrando] = useState(false)
  const reanudarTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    const paso = () => {
      if (!interactuandoRef.current && el.scrollWidth > el.clientWidth) {
        const mitad = el.scrollWidth / 2
        el.scrollLeft += 0.55
        if (el.scrollLeft >= mitad) el.scrollLeft -= mitad
      }
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [itemsCarrusel.length])

  const pausar = () => {
    clearTimeout(reanudarTimer.current)
    interactuandoRef.current = true
  }
  const reanudarConDemora = () => {
    clearTimeout(reanudarTimer.current)
    reanudarTimer.current = setTimeout(() => { interactuandoRef.current = false }, 1500)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = carruselRef.current
    if (!el) return
    pausar()
    arrastreRef.current = { activo: true, inicioX: e.clientX, inicioScroll: el.scrollLeft, movio: false }
    // OJO: el.setPointerCapture() NO va acá. Capturar el puntero en cada pointerdown —incluido
    // uno que termina siendo un simple clic sobre "Leer documento" o la tarjeta— podía desviar
    // el pointerup (y con él el click sintetizado) hacia este contenedor en vez del enlace bajo
    // el cursor, dejando el botón sin navegar. Ahora solo se captura más abajo, en
    // onPointerMove, y únicamente si el gesto se confirma como arrastre real.
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = carruselRef.current
    const a = arrastreRef.current
    if (!el || !a.activo) return
    const dx = e.clientX - a.inicioX
    if (!a.movio && Math.abs(dx) > 3) {
      a.movio = true
      el.setPointerCapture(e.pointerId)
    }
    if (a.movio) el.scrollLeft = a.inicioScroll - dx
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = carruselRef.current
    if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    arrastreRef.current.activo = false
    reanudarConDemora()
  }

  return (
    <section id="bitacora" className="bitacora-seccion" aria-label="Bitácora pública de interrupciones del servicio">
      <div className="bitacora-envoltorio">
        <div className="bitacora-cab">
          <div>
            <div className="bitacora-eyebrow"><span /> BITÁCORA</div>
            <h2 className="bitacora-titulo">Bitácora pública de eventos</h2>
            <p className="bitacora-subtitulo">
              Registro público, de solo anexado, de cortes anunciados, confirmados por la
              ciudadanía y restablecidos en Cartagena.
            </p>
          </div>
          <button onClick={cargarEventos} disabled={cargando} className="bitacora-actualizar hover-glowing">
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            {cargando ? 'Sincronizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="bitacora-filtros" role="tablist" aria-label="Filtrar bitácora por estado">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              role="tab"
              aria-selected={filtro === f.valor}
              className={`bitacora-filtro${filtro === f.valor ? ' is-active' : ''}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.etiqueta}
            </button>
          ))}
          <span className="bitacora-fuente">
            {cargando ? 'conectando con el backend…' : error ? 'sin conexión' : 'datos en vivo'}
          </span>
        </div>

        {error && items.length === 0 && !cargando ? (
          <p className="bitacora-vacio" role="alert">{error}</p>
        ) : itemsFiltrados.length === 0 && !cargando ? (
          <p className="bitacora-vacio">
            {busqueda.trim()
              ? `No hay eventos que coincidan con "${busqueda.trim()}".`
              : 'No hay eventos para este filtro todavía.'}
          </p>
        ) : (
          <div
            ref={carruselRef}
            className={`bitacora-carrusel${arrastrando ? ' is-arrastrando' : ''}`}
            tabIndex={0}
            onPointerDown={(e) => { setArrastrando(true); onPointerDown(e) }}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => { setArrastrando(false); onPointerUp(e) }}
            onPointerCancel={(e) => { setArrastrando(false); onPointerUp(e) }}
            onMouseEnter={pausar}
            onMouseLeave={() => { if (!arrastreRef.current.activo) reanudarConDemora() }}
            onFocus={pausar}
            onBlur={reanudarConDemora}
          >
            {itemsCarrusel.map((item, i) => {
              const Icono = ICONO_POR_ESTADO[item.estado]
              const color = COLOR_POR_ESTADO[item.estado].claro
              return (
                <div
                  key={`${item.id}-${i}`}
                  className="bitacora-tarjeta"
                  style={{ '--color-glow': color } as CSSProperties}
                  onPointerMove={(e) => calcularBrilloBorde(e.currentTarget, e.clientX, e.clientY)}
                  onPointerLeave={(e) => e.currentTarget.style.setProperty('--proximidad-borde', '0')}
                >
                  <div
                    className="bitacora-tarjeta-preview"
                    style={{ background: `color-mix(in srgb, ${color} 16%, var(--color-fondo))` }}
                  >
                    <Icono size={26} color={color} aria-hidden="true" />
                    <svg className="bitacora-tarjeta-ola" viewBox="0 0 200 22" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M0,11 C35,22 55,0 95,11 C135,22 155,0 200,11 L200,22 L0,22 Z" fill={color} />
                    </svg>
                  </div>
                  <div className="bitacora-tarjeta-pie">
                    <span className="bitacora-tarjeta-estado" style={{ color }}>{COLOR_POR_ESTADO[item.estado].etiqueta}</span>
                    <time dateTime={item.fecha}>{formatearFecha(item.fecha)}</time>
                    <h3>{item.titulo}</h3>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
