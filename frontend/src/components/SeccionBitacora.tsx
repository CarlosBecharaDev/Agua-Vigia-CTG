import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FC, PointerEvent as ReactPointerEvent } from 'react'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import { determinarEstadoBoletin } from '../api/acuacar'
import type { BoletinAcuacar } from '../api/acuacar'
import { useConsultaMedios } from '../hooks/useConsultaMedios'
import { CheckCircle2, AlertTriangle, Info, Radio, ExternalLink, Search, CalendarCheck, Inbox, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import type { EstadoRecurso } from '../hooks/useDatosEnVivo'
import './SeccionBitacora.css'

const FILTROS: { valor: 'TODOS' | EstadoServicio; etiqueta: string; icono?: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos los eventos' },
  { valor: 'SIN_SERVICIO', etiqueta: 'Sin servicio' },
  { valor: 'PRESION_BAJA', etiqueta: 'Baja presión' },
  { valor: 'CORTE_PROGRAMADO', etiqueta: 'Programados' },
  { valor: 'CON_SERVICIO', etiqueta: 'Restablecidos' },
]

interface ItemBitacora {
  id: string
  titulo: string
  fecha: string
  /** `null` = el título oficial es informativo y no afirma un estado del servicio. */
  estado: EstadoServicio | null
  /** Boletín que respalda el evento; de aquí sale el enlace "Leer documento". */
  urlOriginal: string | null
  /** Portada y variantes responsivas publicadas por el propio WordPress de Acuacar. */
  imagenUrl: string | null
  imagenSrcSet?: string
  numeroBoletin: string | null
}

const INFORMATIVO = { claro: '#6B7A85', etiqueta: 'Informativo', icono: Info } as const

const ICONO_POR_ESTADO: Record<EstadoServicio, typeof AlertTriangle> = {
  SIN_SERVICIO: AlertTriangle,
  CORTE_PROGRAMADO: Info,
  CON_SERVICIO: CheckCircle2,
  PRESION_BAJA: AlertTriangle,
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

const comoSrcSetServido = (srcSet?: string): string | undefined => srcSet
  ?.split(',')
  .map((variante) => {
    const [url, descriptor] = variante.trim().split(/\s+/)
    return `${comoPortadaServida(url)} ${descriptor}`
  })
  .join(', ')

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
        titulo: 'Acuacar no publicó cortes en este lote',
        detalle: 'No se completa este filtro con reportes internos ni con datos de demostración.',
      }
    case 'PRESION_BAJA':
      return {
        Icono: CheckCircle2,
        titulo: 'Sin boletines de baja presión',
        detalle: 'La fuente oficial consultada no contiene publicaciones clasificadas con este estado.',
      }
    case 'CORTE_PROGRAMADO':
      return {
        Icono: CalendarCheck,
        titulo: 'No hay cortes programados',
        detalle: 'Acuacar no ha publicado mantenimientos en los boletines consultados.',
      }
    case 'CON_SERVICIO':
      return {
        Icono: Info,
        titulo: 'Aún no hay restablecimientos',
        detalle: 'Aquí aparecerán únicamente restablecimientos publicados por Acuacar.',
      }
    default:
      return {
        Icono: Inbox,
        titulo: 'Acuacar no devolvió publicaciones',
        detalle: 'La vista permanece vacía antes que mostrar boletines de otra fuente.',
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
  const local = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Bogota',
  }).format(fecha)
  return `${local.replace(',', ' •')} COT`
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
  boletines?: BoletinAcuacar[]
  estadoAcuacar?: EstadoRecurso
  onRecargarAcuacar?: () => void
}

function aItemAcuacar(boletin: BoletinAcuacar): ItemBitacora {
  return {
    id: `acuacar-${boletin.id}`,
    titulo: boletin.titulo,
    fecha: boletin.fecha,
    estado: determinarEstadoBoletin(boletin.titulo),
    urlOriginal: boletin.url ?? null,
    imagenUrl: boletin.imagenUrl,
    imagenSrcSet: boletin.imagenSrcSet,
    numeroBoletin: `Boletín N° ${boletin.numero.replace(/^#/, '')}`,
  }
}

const SeccionBitacoraBase: FC<Props> = ({
  busqueda = '',
  boletines = [],
  estadoAcuacar = 'empty',
  onRecargarAcuacar,
}) => {
  const [filtro, setFiltro] = useState<'TODOS' | EstadoServicio>('TODOS')
  const [entradaActiva, setEntradaActiva] = useState(false)
  const seccionRef = useRef<HTMLElement>(null)

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

  // La vista pública contiene exclusivamente publicaciones devueltas por Acuacar. La bitácora
  // interna sigue disponible para auditoría en su endpoint, pero no rellena huecos ni aparece como
  // si fuera un boletín oficial cuando WordPress no responde.
  const itemsDisponibles = useMemo(() => boletines
    .map(aItemAcuacar)
    .sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha)), [boletines])

  const itemsFiltrados = useMemo(() => {
    const porEstado = filtro === 'TODOS' ? itemsDisponibles : itemsDisponibles.filter((i) => i.estado === filtro)
    const termino = busqueda.trim().toLowerCase()
    return termino ? porEstado.filter((i) => i.titulo.toLowerCase().includes(termino)) : porEstado
  }, [itemsDisponibles, filtro, busqueda])

  const carruselRef = useRef<HTMLDivElement>(null)
  const primerItemId = itemsFiltrados[0]?.id ?? null
  const arrastreRef = useRef<{ activo: boolean; inicioX: number; inicioScroll: number; movio: boolean }>({
    activo: false, inicioX: 0, inicioScroll: 0, movio: false,
  })
  const [arrastrando, setArrastrando] = useState(false)
  const [puedeIzquierda, setPuedeIzquierda] = useState(false)
  const [puedeDerecha, setPuedeDerecha] = useState(false)

  // Un refetch puede insertar una publicación oficial nueva al principio. Volver al inicio en el
  // mismo ciclo de layout garantiza que lo primero visible sea lo más reciente.
  useLayoutEffect(() => {
    const el = carruselRef.current
    if (!el) return
    el.scrollLeft = 0
  }, [primerItemId, filtro, busqueda])

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
              <span>TRAZABILIDAD PÚBLICA</span>
            </div>
            <h2 className="bitacora-titulo-pro">Bitácora &amp; Boletines Oficiales</h2>
            <p className="bitacora-subtitulo-pro">
              Publicaciones oficiales obtenidas directamente del portal de Acuacar.
            </p>
          </div>
          <div
            className={`bitacora-fuente-acuacar is-${estadoAcuacar}`}
            role="status"
            aria-live="polite"
          >
            {estadoAcuacar === 'loading' ? (
              <><LoaderCircle className="bitacora-fuente-giro" size={15} aria-hidden="true" /> Conectando con Acuacar…</>
            ) : estadoAcuacar === 'success' ? (
              <>
                <Wifi size={15} aria-hidden="true" /> Acuacar conectado · {boletines.length}{' '}
                {boletines.length === 1 ? 'boletín' : 'boletines'}
              </>
            ) : estadoAcuacar === 'unavailable' || estadoAcuacar === 'error' ? (
              <>
                <WifiOff size={15} aria-hidden="true" /> Fuente temporalmente no disponible
                {onRecargarAcuacar && (
                  <button type="button" onClick={onRecargarAcuacar} aria-label="Reintentar conexión con Acuacar">
                    <RefreshCw size={14} aria-hidden="true" />
                  </button>
                )}
              </>
            ) : (
              <><Radio size={15} aria-hidden="true" /> Fuente oficial sin publicaciones</>
            )}
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

        {itemsFiltrados.length === 0 ? (
          (() => {
            const vacio = estadoAcuacar === 'loading'
              ? { Icono: LoaderCircle, titulo: 'Consultando Acuacar', detalle: 'Esperando las publicaciones oficiales más recientes.' }
              : estadoAcuacar === 'unavailable' || estadoAcuacar === 'error'
                ? { Icono: WifiOff, titulo: 'Acuacar no está disponible', detalle: 'No mostramos datos alternativos mientras la fuente oficial no responda.' }
                : mensajeVacio(filtro, busqueda)
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
                          srcSet={comoSrcSetServido(item.imagenSrcSet)}
                          sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1280px) 44vw, 400px"
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
                        {item.numeroBoletin && (
                          <span className="bitacora-numero-boletin">
                            {item.numeroBoletin}
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
                        Ver boletín ↗
                      </a>
                    ) : (
                      <span className="bitacora-tag-tipo" style={{ color }}>
                        <span className="bitacora-dot-indicador" />
                        Boletín oficial de Acuacar
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
