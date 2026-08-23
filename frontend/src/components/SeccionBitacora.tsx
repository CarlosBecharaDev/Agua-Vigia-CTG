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
  const [entradaActiva, setEntradaActiva] = useState(false)
  const seccionRef = useRef<HTMLElement>(null)

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
    let montado = true
    listarBitacora(40)
      .then((eventos) => {
        if (!montado) return
        setItems(eventos.map(aItemBitacora))
        setError(null)
      })
      .catch((causa) => {
        if (montado) setError(normalizarErrorApi(causa).detalle)
      })
      .finally(() => {
        if (montado) setCargando(false)
      })
    return () => { montado = false }
  }, [])

  useEffect(() => {
    const seccion = seccionRef.current
    if (!seccion || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setEntradaActiva(true)
      observer.disconnect()
    }, { threshold: 0.08, rootMargin: '80px 0px' })

    observer.observe(seccion)
    return () => observer.disconnect()
  }, [])

  const itemsFiltrados = useMemo(() => {
    const porEstado = filtro === 'TODOS' ? items : items.filter((i) => i.estado === filtro)
    const termino = busqueda.trim().toLowerCase()
    return termino ? porEstado.filter((i) => i.titulo.toLowerCase().includes(termino)) : porEstado
  }, [items, filtro, busqueda])

  const carruselRef = useRef<HTMLDivElement>(null)
  const arrastreRef = useRef<{ activo: boolean; inicioX: number; inicioScroll: number; movio: boolean }>({
    activo: false, inicioX: 0, inicioScroll: 0, movio: false,
  })
  const [arrastrando, setArrastrando] = useState(false)

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = carruselRef.current
    if (!el) return
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
  }

  return (
    <section
      id="bitacora"
      ref={seccionRef}
      className={`bitacora-seccion${entradaActiva ? ' is-visible' : ''}`}
      aria-label="Bitácora pública de interrupciones del servicio"
    >
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
          <>
            <div className="bitacora-carrusel-meta">
              <span>{itemsFiltrados.length} eventos recientes</span>
              <span>Desliza o arrastra para explorar</span>
            </div>
            <div
              ref={carruselRef}
              className={`bitacora-carrusel-pro${arrastrando ? ' is-arrastrando' : ''}`}
              tabIndex={0}
              role="region"
              aria-label="Eventos recientes de la bitácora"
              onPointerDown={(e) => { setArrastrando(true); onPointerDown(e) }}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => { setArrastrando(false); onPointerUp(e) }}
              onPointerCancel={(e) => { setArrastrando(false); onPointerUp(e) }}
            >
            {itemsFiltrados.map((item) => {
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
                  key={item.id}
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
          </>
        )}
      </div>
    </section>
  )
}
