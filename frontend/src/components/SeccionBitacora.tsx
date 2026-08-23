import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FC, PointerEvent as ReactPointerEvent } from 'react'
import { listarBitacora } from '../api/services'
import type { EventoBitacora, TipoEventoBitacora } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import { RefreshCw, CheckCircle2, AlertTriangle, Info, Radio } from 'lucide-react'
import './SeccionBitacora.css'

const ESTADO_POR_TIPO: Record<TipoEventoBitacora, EstadoServicio> = {
  CORTE_ANUNCIADO: 'CORTE_PROGRAMADO',
  CORTE_CONFIRMADO_POR_CIUDADANOS: 'SIN_SERVICIO',
  CORTE_RESTABLECIDO: 'CON_SERVICIO',
}

const FILTROS: { valor: 'TODOS' | EstadoServicio; etiqueta: string; icono?: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos los eventos' },
  { valor: 'SIN_SERVICIO', etiqueta: '🔴 Sin servicio' },
  { valor: 'PRESION_BAJA', etiqueta: '🟡 Baja presión' },
  { valor: 'CORTE_PROGRAMADO', etiqueta: '🔵 Programados' },
  { valor: 'CON_SERVICIO', etiqueta: '🟢 Restablecidos' },
]

interface ItemBitacora {
  id: string
  titulo: string
  fecha: string
  estado: EstadoServicio
  tipo: TipoEventoBitacora
}

const ICONO_POR_ESTADO: Record<EstadoServicio, typeof AlertTriangle> = {
  SIN_SERVICIO: AlertTriangle,
  CORTE_PROGRAMADO: Info,
  CON_SERVICIO: CheckCircle2,
  PRESION_BAJA: AlertTriangle,
}

const formatearFechaRelativa = (isoString: string) => {
  const fecha = new Date(isoString)
  const ahora = new Date()
  const diffMin = Math.floor((ahora.getTime() - fecha.getTime()) / 60000)
  if (diffMin < 60) return `hace ${Math.max(1, diffMin)} min`
  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `hace ${diffHoras} h`
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(fecha)
}

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
  busqueda?: string
}

function aItemBitacora(evento: EventoBitacora): ItemBitacora {
  return {
    id: evento.id,
    titulo: evento.descripcion,
    fecha: evento.timestamp,
    estado: ESTADO_POR_TIPO[evento.tipo as TipoEventoBitacora] ?? 'CORTE_PROGRAMADO',
    tipo: evento.tipo as TipoEventoBitacora,
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
      const eventos = await listarBitacora(40)
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

  const itemsCarrusel = itemsFiltrados.length > 1 ? [...itemsFiltrados, ...itemsFiltrados] : itemsFiltrados

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
        el.scrollLeft += 0.5
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
        {/* Cabecera Apple Pro */}
        <div className="bitacora-cab">
          <div>
            <div className="bitacora-eyebrow-pro">
              <span className="pulse-dot" />
              <span>FEED DE EVENTOS EN VIVO</span>
            </div>
            <h2 className="bitacora-titulo-pro">Bitácora de Suministro y Redes</h2>
            <p className="bitacora-subtitulo-pro">
              Registro público, inmutable y en tiempo real de cortes anunciados, confirmaciones de presión
              y restablecimientos comunitarios en Cartagena.
            </p>
          </div>
          <button onClick={cargarEventos} disabled={cargando} className="bitacora-actualizar-pro">
            <RefreshCw size={15} className={cargando ? 'animate-spin' : ''} />
            {cargando ? 'Sincronizando…' : 'Actualizar feed'}
          </button>
        </div>

        {/* Filtros Segmentados */}
        <div className="bitacora-filtros-pro" role="tablist" aria-label="Filtrar bitácora por estado">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              role="tab"
              aria-selected={filtro === f.valor}
              className={`bitacora-filtro-btn${filtro === f.valor ? ' is-active' : ''}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.etiqueta}
            </button>
          ))}
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
            className={`bitacora-carrusel-pro${arrastrando ? ' is-arrastrando' : ''}`}
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
              const badgeClass =
                item.estado === 'SIN_SERVICIO'
                  ? 'badge-sin-servicio'
                  : item.estado === 'PRESION_BAJA'
                  ? 'badge-presion-baja'
                  : item.estado === 'CORTE_PROGRAMADO'
                  ? 'badge-corte-programado'
                  : 'badge-con-servicio'

              const tagFuente =
                item.tipo === 'CORTE_CONFIRMADO_POR_CIUDADANOS'
                  ? 'Masa crítica ciudadana'
                  : item.tipo === 'CORTE_ANUNCIADO'
                  ? 'Aviso preventivo oficial'
                  : 'Servicio normalizado'

              return (
                <div
                  key={`${item.id}-${i}`}
                  className="bitacora-tarjeta-pro"
                  style={{ '--color-glow': color } as CSSProperties}
                  onPointerMove={(e) => calcularBrilloBorde(e.currentTarget, e.clientX, e.clientY)}
                  onPointerLeave={(e) => e.currentTarget.style.setProperty('--proximidad-borde', '0')}
                >
                  <div>
                    <div className="bitacora-tarjeta-cabecera">
                      <span className={`bitacora-badge-estado ${badgeClass}`}>
                        <Icono size={14} aria-hidden="true" />
                        {COLOR_POR_ESTADO[item.estado].etiqueta}
                      </span>
                      <time className="bitacora-tiempo-pro" dateTime={item.fecha}>
                        {formatearFechaRelativa(item.fecha)}
                      </time>
                    </div>

                    <div className="bitacora-tarjeta-cuerpo">
                      <h3>{item.titulo}</h3>
                    </div>
                  </div>

                  <div className="bitacora-tarjeta-pie-pro">
                    <span className="bitacora-tag-tipo" style={{ color }}>
                      <span className="bitacora-dot-indicador" />
                      {tagFuente}
                    </span>
                    <Radio size={13} style={{ opacity: 0.5, color: '#94a3b8' }} aria-hidden="true" />
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
