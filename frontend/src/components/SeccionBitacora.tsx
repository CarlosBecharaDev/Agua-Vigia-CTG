import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FC } from 'react'
import { AlertTriangle, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Inbox, Info, Search } from 'lucide-react'
import { listarBitacora } from '../api/services'
import type { EventoBitacora, TipoEventoBitacora } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import './SeccionBitacora.css'

const ESTADO_POR_TIPO: Partial<Record<TipoEventoBitacora, EstadoServicio>> = {
  CORTE_ANUNCIADO: 'CORTE_PROGRAMADO',
  CORTE_CONFIRMADO_POR_CIUDADANOS: 'SIN_SERVICIO',
  CORTE_RESTABLECIDO: 'CON_SERVICIO',
}

const FILTROS: { valor: 'TODOS' | EstadoServicio; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'SIN_SERVICIO', etiqueta: 'Sin servicio' },
  { valor: 'PRESION_BAJA', etiqueta: 'Baja presión' },
  { valor: 'CORTE_PROGRAMADO', etiqueta: 'Programados' },
  { valor: 'CON_SERVICIO', etiqueta: 'Restablecidos' },
]

interface ItemBitacora {
  id: string
  titulo: string
  fecha: string
  estado: EstadoServicio | null
  urlOriginal: string | null
  imagenUrl: string | null
}

const PREFIJO_MEDIOS_ACUACAR = 'https://www.acuacar.com/wp-content/uploads/'
const comoPortadaServida = (url: string): string =>
  url.startsWith(PREFIJO_MEDIOS_ACUACAR)
    ? `/acuacar-media/${url.slice(PREFIJO_MEDIOS_ACUACAR.length)}`
    : url

const formatearFecha = (isoString: string) => {
  const fecha = new Date(isoString)
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (diffMin >= 0 && diffMin < 60) return `hace ${Math.max(1, diffMin)} min`
  if (diffMin >= 60 && diffMin < 1440) return `hace ${Math.floor(diffMin / 60)} h`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha)
}

const etiquetaEstado = (estado: EstadoServicio | null) =>
  estado ? COLOR_POR_ESTADO[estado].etiqueta : 'Informativo'

function mensajeVacio(filtro: 'TODOS' | EstadoServicio, busqueda: string) {
  if (busqueda.trim()) return `Sin coincidencias para “${busqueda.trim()}”`
  if (filtro === 'CORTE_PROGRAMADO') return 'No hay cortes programados publicados'
  if (filtro === 'SIN_SERVICIO') return 'No hay eventos publicados con estado sin servicio'
  if (filtro === 'PRESION_BAJA') return 'No hay eventos publicados de baja presión'
  if (filtro === 'CON_SERVICIO') return 'No hay restablecimientos publicados'
  return 'La bitácora está vacía'
}

interface Props { busqueda?: string }

const SeccionBitacoraBase: FC<Props> = ({ busqueda = '' }) => {
  const [items, setItems] = useState<ItemBitacora[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | EstadoServicio>('TODOS')
  const [busquedaInterna, setBusquedaInterna] = useState('')
  const carruselRef = useRef<HTMLDivElement>(null)
  const [puedeIzquierda, setPuedeIzquierda] = useState(false)
  const [puedeDerecha, setPuedeDerecha] = useState(false)

  const cargar = useCallback(() => {
    let montado = true
    setCargando(true)
    setError(null)
    listarBitacora(40)
      .then((eventos: EventoBitacora[]) => {
        if (!montado) return
        setItems(eventos.map((evento) => ({
          id: evento.id,
          titulo: evento.descripcion,
          fecha: evento.timestamp,
          estado: evento.estado ?? ESTADO_POR_TIPO[evento.tipo as TipoEventoBitacora] ?? null,
          urlOriginal: evento.urlOriginal ?? null,
          imagenUrl: evento.imagenUrl ?? null,
        })))
      })
      .catch((causa) => {
        if (montado) setError(normalizarErrorApi(causa).detalle)
      })
      .finally(() => {
        if (montado) setCargando(false)
      })
    return () => { montado = false }
  }, [])

  useEffect(() => cargar(), [cargar])

  const termino = (busqueda || busquedaInterna).trim().toLowerCase()
  const visibles = useMemo(() => items.filter((item) =>
    (filtro === 'TODOS' || item.estado === filtro) && (!termino || item.titulo.toLowerCase().includes(termino))
  ), [filtro, items, termino])

  const revisarCarrusel = useCallback(() => {
    const carrusel = carruselRef.current
    if (!carrusel) return
    const maximo = carrusel.scrollWidth - carrusel.clientWidth
    setPuedeIzquierda(carrusel.scrollLeft > 4)
    setPuedeDerecha(carrusel.scrollLeft < maximo - 4)
  }, [])

  useEffect(() => {
    const carrusel = carruselRef.current
    if (!carrusel) return
    revisarCarrusel()
    carrusel.addEventListener('scroll', revisarCarrusel, { passive: true })
    const observador = new ResizeObserver(revisarCarrusel)
    observador.observe(carrusel)
    return () => {
      carrusel.removeEventListener('scroll', revisarCarrusel)
      observador.disconnect()
    }
  }, [revisarCarrusel, visibles.length])

  const desplazar = (direccion: -1 | 1) => {
    const carrusel = carruselRef.current
    if (!carrusel) return
    const tarjeta = carrusel.querySelector<HTMLElement>('.bitacora-tarjeta-pro')
    carrusel.scrollBy({ left: direccion * (tarjeta?.offsetWidth ?? 280), behavior: 'smooth' })
  }

  return (
    <section id="bitacora" className="bitacora-seccion is-visible" aria-labelledby="bitacora-titulo">
      <div className="bitacora-envoltorio">
        <div className="bitacora-cab">
          <div>
            <div className="bitacora-eyebrow-pro"><span>Fuentes públicas verificables</span></div>
            <h2 id="bitacora-titulo" className="bitacora-titulo-pro">Bitácora del servicio</h2>
            <p className="bitacora-subtitulo-pro">
              Avisos y eventos recibidos por la API. Si la fuente no entrega información, no mostramos reemplazos simulados.
            </p>
          </div>
        </div>

        <div className="bitacora-barra-filtros-stitch">
          <div className="bitacora-filtros-pro" role="tablist" aria-label="Filtrar bitácora por estado">
            {FILTROS.map((opcion) => (
              <button key={opcion.valor} type="button" role="tab" aria-selected={filtro === opcion.valor}
                className={`bitacora-filtro-btn${filtro === opcion.valor ? ' is-active' : ''}`}
                onClick={() => setFiltro(opcion.valor)}>
                {opcion.etiqueta}
              </button>
            ))}
          </div>
          {!busqueda && (
            <label className="bitacora-busqueda-wrap">
              <Search size={14} className="bitacora-busqueda-icono" aria-hidden="true" />
              <span className="sr-only">Buscar en la bitácora</span>
              <input type="search" className="bitacora-busqueda-input" placeholder="Buscar barrio o evento…"
                value={busquedaInterna} onChange={(evento) => setBusquedaInterna(evento.target.value)} />
            </label>
          )}
        </div>

        {cargando ? (
          <div className="bitacora-vacio" role="status">Consultando la bitácora…</div>
        ) : error ? (
          <div className="bitacora-vacio bitacora-vacio--error" role="alert">
            <AlertTriangle className="bitacora-vacio-icono" size={24} aria-hidden="true" />
            <p className="bitacora-vacio-titulo">No pudimos consultar la bitácora</p>
            <p className="bitacora-vacio-texto">{error}</p>
            <button type="button" onClick={cargar}>Reintentar consulta</button>
          </div>
        ) : visibles.length === 0 ? (
          <div className="bitacora-vacio" role="status">
            {filtro === 'CORTE_PROGRAMADO' ? <CalendarCheck size={28} aria-hidden="true" /> : <Inbox size={28} aria-hidden="true" />}
            <p className="bitacora-vacio-titulo">{mensajeVacio(filtro, busqueda || busquedaInterna)}</p>
            <p className="bitacora-vacio-texto">No se agregan boletines, radicados ni métricas de respaldo.</p>
          </div>
        ) : (
          <div className="bitacora-carrusel-marco">
            <div ref={carruselRef} className="bitacora-carrusel-pro" aria-label="Eventos publicados">
              {visibles.map((item) => {
              const Icono = item.estado === 'CON_SERVICIO' ? CheckCircle2 : item.estado ? AlertTriangle : Info
              return (
                <article key={item.id} className="bitacora-tarjeta-pro">
                  {item.imagenUrl && <div className="bitacora-portada-marco"><img src={comoPortadaServida(item.imagenUrl)} alt=""
                    role="presentation" className="bitacora-portada" loading="lazy" /></div>}
                  <div className="bitacora-tarjeta-cuerpo">
                    <span className={`bitacora-badge-estado${item.estado ? ` badge-${item.estado.toLowerCase().replace('_', '-')}` : ''}`}>
                      <Icono size={14} aria-hidden="true" /> {etiquetaEstado(item.estado)}
                    </span>
                    <h3 className="bitacora-tarjeta-titulo">{item.titulo}</h3>
                    <time className="bitacora-tarjeta-fecha" dateTime={item.fecha}>{formatearFecha(item.fecha)}</time>
                    {item.urlOriginal && <a className="bitacora-tarjeta-enlace" href={item.urlOriginal} target="_blank" rel="noreferrer">
                      Abrir fuente original <ExternalLink size={14} aria-hidden="true" />
                    </a>}
                  </div>
                </article>
              )
              })}
            </div>
            <div className="bitacora-flechas" aria-label="Controles del carrusel">
              <button type="button" className="bitacora-flecha" disabled={!puedeIzquierda}
                onClick={() => desplazar(-1)} aria-label="Ver boletines anteriores">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" className="bitacora-flecha" disabled={!puedeDerecha}
                onClick={() => desplazar(1)} aria-label="Ver más boletines">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export const SeccionBitacora = memo(SeccionBitacoraBase)
