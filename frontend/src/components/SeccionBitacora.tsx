import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FC, PointerEvent as ReactPointerEvent } from 'react'
import { listarBitacora } from '../api/services'
import type { EventoBitacora, TipoEventoBitacora } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import { useConsultaMedios } from '../hooks/useConsultaMedios'
import { CheckCircle2, AlertTriangle, Info, Radio, ExternalLink, Search, CalendarCheck, Inbox, ChevronLeft, ChevronRight } from 'lucide-react'
import './SeccionBitacora.css'

/** Respaldo para los eventos que no traen `estado` propio. La ingesta sí lo trae, y por eso no
 *  figura aquí: su estado depende del boletín, no de su tipo. */
const ESTADO_POR_TIPO: Partial<Record<TipoEventoBitacora, EstadoServicio>> = {
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
  /** `null` = el backend mandó un tipo que no habla del servicio (un premio, la calidad del
   *  agua, un programa ambiental). Antes esos caían por defecto en CORTE_PROGRAMADO y la
   *  bitácora los anunciaba como si fueran un corte; ahora se listan como lo que son. */
  estado: EstadoServicio | null
  tipo: TipoEventoBitacora | string
  /** Boletín que respalda el evento; de aquí sale el enlace "Leer documento". */
  urlOriginal: string | null
  /** Portada del boletín. La trae el propio evento: el backend la captura al ingerir. */
  imagenUrl: string | null
}

const INFORMATIVO = { claro: '#6B7A85', etiqueta: 'Informativo', icono: Info } as const

const ICONO_POR_ESTADO: Record<EstadoServicio, typeof AlertTriangle> = {
  SIN_SERVICIO: AlertTriangle,
  CORTE_PROGRAMADO: Info,
  CON_SERVICIO: CheckCircle2,
  PRESION_BAJA: AlertTriangle,
}

/**
 * El número del boletín sale de su propia URL (`/2854-aguas-de-cartagena-…`), no de la API de
 * Acuacar: así la tarjeta lo muestra sin depender de que el navegador se la
 * pide. Lo mismo vale para el enlace "Leer documento", que solo necesita la URL.
 */
const numeroDeBoletin = (url: string): string | null => {
  const coincidencia = url.match(/acuacar\.com\/(?:boletin-)?(\d{3,5})-/)
  return coincidencia ? `#${coincidencia[1]}` : null
}

/**
 * Las portadas se piden por nuestro propio dominio, no directo a acuacar.com: el sitio bloquea el
 * hotlinking —la misma imagen responde 200 sin `Referer` y 403 con uno de otro dominio, verificado
 * el 31/08/2026— así que el `<img>` del navegador nunca cargaba. `/acuacar-media/` es el proxy que
 * sirven `nginx.conf` en producción y `vite.config.ts` en desarrollo.
 *
 * Si la URL no es de acuacar.com se devuelve tal cual: una fuente futura puede permitir el enlace
 * directo, y forzarla por un proxy que apunta a otro dominio la rompería.
 */
const PREFIJO_MEDIOS_ACUACAR = 'https://www.acuacar.com/wp-content/uploads/'

const comoPortadaServida = (url: string): string =>
  url.startsWith(PREFIJO_MEDIOS_ACUACAR)
    ? `/acuacar-media/${url.slice(PREFIJO_MEDIOS_ACUACAR.length)}`
    : url

/**
 * Qué decir cuando un filtro no devuelve nada. No es un error ni un hueco: en una plataforma que
 * vigila el acueducto, "ningún barrio sin servicio" es la mejor noticia posible, y leerlo así
 * informa más que un «no hay resultados». Cada filtro dice además *por qué* está vacío, que es lo
 * que un vecino necesita para confiar en el dato.
 */
function mensajeVacio(filtro: 'TODOS' | EstadoServicio, busqueda: string) {
  const termino = busqueda.trim()
  if (termino) {
    return {
      Icono: Search,
      titulo: `Sin coincidencias para "${termino}"`,
      detalle: 'Prueba con el nombre de un barrio o quita el filtro de estado.',
    }
  }
  switch (filtro) {
    case 'SIN_SERVICIO':
      return {
        Icono: CheckCircle2,
        titulo: 'Ningún barrio sin servicio',
        detalle: 'Acuacar no ha anunciado cortes activos y ningún vecino ha reportado falta de agua.',
      }
    case 'PRESION_BAJA':
      return {
        Icono: CheckCircle2,
        titulo: 'Sin reportes de baja presión',
        detalle: 'Nadie ha reportado presión insuficiente en las últimas horas.',
      }
    case 'CORTE_PROGRAMADO':
      return {
        Icono: CalendarCheck,
        titulo: 'No hay cortes programados',
        detalle: 'Acuacar no ha anunciado mantenimientos con fecha y hora por ahora.',
      }
    case 'CON_SERVICIO':
      return {
        Icono: Info,
        titulo: 'Aún no hay restablecimientos',
        detalle: 'Aquí aparecerán los barrios a los que Acuacar confirme el regreso del servicio.',
      }
    default:
      return {
        Icono: Inbox,
        titulo: 'La bitácora está vacía',
        detalle: 'En cuanto Acuacar publique un boletín o alguien reporte una falla, aparecerá aquí.',
      }
  }
}

/**
 * "hace 2 h" solo sirve para lo de hoy. La bitácora cubre cinco años de boletines, y ahí un
 * relativo no informa: lo que un vecino quiere leer es «8 de julio de 2026». Por debajo de un día
 * se mantiene el relativo, que es más natural para lo que acaba de pasar.
 */
const formatearFecha = (isoString: string) => {
  const fecha = new Date(isoString)
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (diffMin < 60) return `hace ${Math.max(1, diffMin)} min`
  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `hace ${diffHoras} h`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha)
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
    // El estado que el propio evento afirma manda sobre el que se deduce de su tipo: la ingesta
    // publica tanto cortes como restablecimientos, así que su tipo no basta para saber cuál es.
    estado: evento.estado ?? ESTADO_POR_TIPO[evento.tipo as TipoEventoBitacora] ?? null,
    tipo: evento.tipo,
    urlOriginal: evento.urlOriginal ?? null,
    imagenUrl: evento.imagenUrl ?? null,
  }
}

const SeccionBitacoraBase: FC<Props> = ({ busqueda = '' }) => {
  const [items, setItems] = useState<ItemBitacora[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | EstadoServicio>('TODOS')
  const [entradaActiva, setEntradaActiva] = useState(false)
  const seccionRef = useRef<HTMLElement>(null)

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
  const [puedeIzquierda, setPuedeIzquierda] = useState(false)
  const [puedeDerecha, setPuedeDerecha] = useState(false)

  // Por debajo de 640px las flechas dejan de flotar sobre los costados de la tarjeta (no hay
  // margen fuera de ella) y bajan a un paginador debajo del carrusel. Ahí sí se dibujan
  // siempre: si desaparecieran al llegar a un extremo, la fila entera daría un salto.
  const flechasAbajo = useConsultaMedios('(max-width: 640px)')

  /**
   * Qué flechas tienen sentido ahora mismo. El margen de 4px absorbe el redondeo subpíxel del
   * scroll: sin él, al llegar al final `scrollLeft` queda en 1187.5 contra un máximo de 1188 y la
   * flecha derecha se quedaba encendida sin poder avanzar.
   */
  const revisarExtremos = useCallback(() => {
    const el = carruselRef.current
    if (!el) return
    const maximo = el.scrollWidth - el.clientWidth
    setPuedeIzquierda(el.scrollLeft > 4)
    setPuedeDerecha(el.scrollLeft < maximo - 4)
  }, [])

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return
    revisarExtremos()
    el.addEventListener('scroll', revisarExtremos, { passive: true })
    // El ancho de tarjeta depende del ancho del carrusel: al redimensionar cambia si hay o no
    // desbordamiento, y con ello si las flechas deben existir.
    const observador = new ResizeObserver(revisarExtremos)
    observador.observe(el)
    return () => {
      el.removeEventListener('scroll', revisarExtremos)
      observador.disconnect()
    }
  }, [revisarExtremos, itemsFiltrados.length])

  /** Avanza una tarjeta, no un ancho de pantalla: es la unidad que el usuario está leyendo. */
  const desplazar = (sentido: 1 | -1) => {
    const el = carruselRef.current
    if (!el) return
    const tarjeta = el.querySelector<HTMLElement>('.bitacora-tarjeta-pro')
    const paso = tarjeta ? tarjeta.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: paso * sentido, behavior: 'smooth' })
  }

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
              <span>ÚLTIMOS BOLETINES</span>
            </div>
            <h2 className="bitacora-titulo-pro">Bitácora de Suministro y Redes</h2>
            <p className="bitacora-subtitulo-pro">
              Registro público, inmutable y en tiempo real de cortes anunciados, confirmaciones de presión
              y restablecimientos comunitarios en Cartagena.
            </p>
          </div>
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
          (() => {
            const vacio = mensajeVacio(filtro, busqueda)
            const IconoVacio = vacio.Icono
            return (
              // `key` fuerza el remontaje al cambiar de filtro: sin él React reutiliza el nodo, la
              // animación no vuelve a dispararse y el cambio de mensaje pasa desapercibido.
              <div className="bitacora-vacio" key={`${filtro}-${busqueda}`} role="status">
                <IconoVacio className="bitacora-vacio-icono" size={30} aria-hidden="true" />
                <p className="bitacora-vacio-titulo">{vacio.titulo}</p>
                <p className="bitacora-vacio-texto">{vacio.detalle}</p>
              </div>
            )
          })()
        ) : (
          <>
            <div className="bitacora-carrusel-marco">
            {/* Las flechas solo existen si hay a dónde ir en ese sentido: una flecha que no lleva
                a ninguna parte es peor que ninguna flecha. Se ocultan del lector de pantalla
                porque el carrusel ya se recorre con el teclado. */}
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
              const Icono = item.estado ? ICONO_POR_ESTADO[item.estado] : INFORMATIVO.icono
              const paleta = item.estado ? COLOR_POR_ESTADO[item.estado] : INFORMATIVO
              const color = paleta.claro
              const badgeClass =
                item.estado === null
                  ? 'badge-informativo'
                  : item.estado === 'SIN_SERVICIO'
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
                  : item.tipo === 'CORTE_RESTABLECIDO'
                  ? 'Servicio normalizado'
                  : 'Boletín informativo'

              return (
                <div
                  key={item.id}
                  className="bitacora-tarjeta-pro"
                  style={{ '--color-glow': color } as CSSProperties}
                  onPointerMove={(e) => calcularBrilloBorde(e.currentTarget, e.clientX, e.clientY)}
                  onPointerLeave={(e) => e.currentTarget.style.setProperty('--proximidad-borde', '0')}
                >
                  <div>
                    {item.imagenUrl && (
                      <div className="bitacora-portada-marco">
                        <img
                          className="bitacora-portada"
                          src={comoPortadaServida(item.imagenUrl)}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          // Una portada rota no puede dejar un hueco ni el texto alternativo encima
                          // del resto de la tarjeta: se retira el marco y la tarjeta queda sin foto.
                          onError={(e) => {
                            const marco = e.currentTarget.parentElement
                            if (marco) marco.style.display = 'none'
                          }}
                        />
                        {item.urlOriginal && numeroDeBoletin(item.urlOriginal) && (
                          <span className="bitacora-numero-boletin">
                            {numeroDeBoletin(item.urlOriginal)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="bitacora-tarjeta-cabecera">
                      <span className={`bitacora-badge-estado ${badgeClass}`}>
                        <Icono size={14} aria-hidden="true" />
                        {paleta.etiqueta}
                      </span>
                      <time className="bitacora-tiempo-pro" dateTime={item.fecha}>
                        {formatearFecha(item.fecha)}
                      </time>
                    </div>

                    <div className="bitacora-tarjeta-cuerpo">
                      <h3>{item.titulo}</h3>
                    </div>
                  </div>

                  <div className="bitacora-tarjeta-pie-pro">
                    {item.urlOriginal ? (
                      <a
                        className="bitacora-leer-documento"
                        href={item.urlOriginal}
                        target="_blank"
                        // noopener/noreferrer porque es un dominio ajeno: sin ellos la página de
                        // destino recibe una referencia a esta ventana y puede redirigirla.
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                        Leer documento
                      </a>
                    ) : (
                      <span className="bitacora-tag-tipo" style={{ color }}>
                        <span className="bitacora-dot-indicador" />
                        {tagFuente}
                      </span>
                    )}
                    <Radio size={13} style={{ opacity: 0.5, color: '#94a3b8' }} aria-hidden="true" />
                  </div>
                </div>
              )
            })}
            </div>

            {/* `display: contents` en escritorio: los dos botones siguen siendo hijos absolutos
                del marco y se pegan a sus costados como siempre. En teléfono el envoltorio se
                convierte en la fila del paginador. */}
            <div className="bitacora-flechas">
              {(puedeIzquierda || flechasAbajo) && (
                <button
                  type="button"
                  className="bitacora-flecha bitacora-flecha-izq"
                  onClick={() => desplazar(-1)}
                  disabled={!puedeIzquierda}
                  aria-label="Ver boletines anteriores"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
              )}
              {(puedeDerecha || flechasAbajo) && (
                <button
                  type="button"
                  className="bitacora-flecha bitacora-flecha-der"
                  onClick={() => desplazar(1)}
                  disabled={!puedeDerecha}
                  aria-label="Ver más boletines"
                >
                  <ChevronRight size={20} aria-hidden="true" />
                </button>
              )}
            </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* Su única prop es una cadena, así que memo la salta en cualquier re-render de la página que
   no cambie la búsqueda — el de colapsar la columna de sectores, por ejemplo, que antes la
   obligaba a volver a pintar sus cuarenta tarjetas por nada. */
export const SeccionBitacora = memo(SeccionBitacoraBase)
