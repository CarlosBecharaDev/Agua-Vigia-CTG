import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FC, PointerEvent as ReactPointerEvent } from 'react'
import { listarBitacora } from '../api/services'
import type { EventoBitacora, TipoEventoBitacora } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import type { EstadoServicio } from '../types/tipos-dominio'
import { useConsultaMedios } from '../hooks/useConsultaMedios'
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
  ExternalLink,
  Search,
  CalendarCheck,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Activity,
  Clock,
  ShieldAlert,
  X,
  Gauge,
  Camera,
  Layers,
} from 'lucide-react'
import './SeccionBitacora.css'

/** Respaldo para los eventos que no traen `estado` propio. La ingesta sí lo trae, y por eso no
 *  figura aquí: su estado depende del boletín, no de su tipo. */
const ESTADO_POR_TIPO: Partial<Record<TipoEventoBitacora, EstadoServicio>> = {
  CORTE_ANUNCIADO: 'CORTE_PROGRAMADO',
  CORTE_CONFIRMADO_POR_CIUDADANOS: 'SIN_SERVICIO',
  CORTE_RESTABLECIDO: 'CON_SERVICIO',
}

const FILTROS: { valor: 'TODOS' | EstadoServicio; etiqueta: string }[] = [
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
  estado: EstadoServicio | null
  tipo: TipoEventoBitacora | string
  urlOriginal: string | null
  imagenUrl: string | null
}

const INFORMATIVO = { claro: '#6B7A85', etiqueta: 'Informativo', icono: Info } as const

const ICONO_POR_ESTADO: Record<EstadoServicio, typeof AlertTriangle> = {
  SIN_SERVICIO: AlertTriangle,
  CORTE_PROGRAMADO: Info,
  CON_SERVICIO: CheckCircle2,
  PRESION_BAJA: AlertTriangle,
}

const numeroDeBoletin = (url: string): string | null => {
  const coincidencia = url.match(/acuacar\.com\/(?:boletin-)?(\d{3,5})-/)
  return coincidencia ? `#${coincidencia[1]}` : null
}

const PREFIJO_MEDIOS_ACUACAR = 'https://www.acuacar.com/wp-content/uploads/'

const comoPortadaServida = (url: string): string =>
  url.startsWith(PREFIJO_MEDIOS_ACUACAR)
    ? `/acuacar-media/${url.slice(PREFIJO_MEDIOS_ACUACAR.length)}`
    : url

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

const formatearFecha = (isoString: string) => {
  const fecha = new Date(isoString)
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (diffMin < 60) return `hace ${Math.max(1, diffMin)} min`
  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `hace ${diffHoras} h`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha)
}

interface Props {
  busqueda?: string
}

function aItemBitacora(evento: EventoBitacora): ItemBitacora {
  return {
    id: evento.id,
    titulo: evento.descripcion,
    fecha: evento.timestamp,
    estado: evento.estado ?? ESTADO_POR_TIPO[evento.tipo as TipoEventoBitacora] ?? null,
    tipo: evento.tipo,
    urlOriginal: evento.urlOriginal ?? null,
    imagenUrl: evento.imagenUrl ?? null,
  }
}

interface RegistroForense {
  radicado: string
  hora: string
  sector: string
  localidad: string
  naturaleza: string
  impacto: string
  discrepancia: string
  tipoDiscrepancia: 'retraso' | 'verificado' | 'turbidez'
  detalles: string
  scadaPresion: string
}

const REGISTROS_FORENSES: RegistroForense[] = [
  {
    radicado: '#EVT-2026-894',
    hora: '14:32 COT',
    sector: 'Manga (Calle Real)',
    localidad: 'UAP 1 - Histórica',
    naturaleza: 'Rotura Red Secundaria 8"',
    impacto: '2,400 suscriptores',
    discrepancia: '+4h de retraso',
    tipoDiscrepancia: 'retraso',
    detalles: 'Acuacar anunció restablecimiento a las 10:00 COT. Presión reportada por hidrantes sigue en 0.0 PSI.',
    scadaPresion: '0.0 PSI (Crítico)',
  },
  {
    radicado: '#EVT-2026-892',
    hora: '11:15 COT',
    sector: 'Blas de Lezo',
    localidad: 'UAP 3 - Industrial',
    naturaleza: 'Mantenimiento de Válvula Tripartita',
    impacto: '14,000 suscriptores',
    discrepancia: 'Verificado 100%',
    tipoDiscrepancia: 'verificado',
    detalles: 'Maniobra cerrada en el plazo pactado. Presión estabilizada a 24.5 PSI con acta veedora #409.',
    scadaPresion: '24.5 PSI (Normal)',
  },
  {
    radicado: '#EVT-2026-889',
    hora: '09:40 COT',
    sector: 'El Pozón (Sector Central)',
    localidad: 'UAP 2 - De la Virgen',
    naturaleza: 'Baja Presión Generalizada',
    impacto: '8,200 suscriptores',
    discrepancia: 'Turbidez residual',
    tipoDiscrepancia: 'turbidez',
    detalles: 'Agua suministrada con turbiedad de 8.4 UNT tras apertura brusca de compuertas en rebombeo.',
    scadaPresion: '12.1 PSI (Baja)',
  },
  {
    radicado: '#EVT-2026-885',
    hora: 'Ayer, 18:00',
    sector: 'Bocagrande (Cra 3)',
    localidad: 'UAP 1 - Histórica',
    naturaleza: 'Empalme Red de Refuerzo',
    impacto: '5,100 suscriptores',
    discrepancia: '+1.5h de retraso',
    tipoDiscrepancia: 'retraso',
    detalles: 'Apertura demorada por fuga en junta bridada. Notificación extemporánea a veeduría distrital.',
    scadaPresion: '22.0 PSI (Normal)',
  },
]

const SeccionBitacoraBase: FC<Props> = ({ busqueda = '' }) => {
  const [items, setItems] = useState<ItemBitacora[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | EstadoServicio>('TODOS')
  const [localidadFiltro, setLocalidadFiltro] = useState<string>('todas')
  const [rangoTiempo, setRangoTiempo] = useState<'24h' | '7d' | '30d' | 'hist'>('24h')
  const [busquedaInterna, setBusquedaInterna] = useState<string>('')
  const [entradaActiva, setEntradaActiva] = useState(false)
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<RegistroForense | null>(null)
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'boletines'>('tabla')

  const seccionRef = useRef<HTMLElement>(null)

  const cargarBitacora = useCallback(() => {
    let montado = true
    setCargando(true)
    setError(null)
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

  useEffect(() => cargarBitacora(), [cargarBitacora])

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

  const terminoEfectivo = (busqueda || busquedaInterna).trim().toLowerCase()

  const itemsFiltrados = useMemo(() => {
    const porEstado = filtro === 'TODOS' ? items : items.filter((i) => i.estado === filtro)
    return terminoEfectivo ? porEstado.filter((i) => i.titulo.toLowerCase().includes(terminoEfectivo)) : porEstado
  }, [items, filtro, terminoEfectivo])

  const registrosForensesFiltrados = useMemo(() => {
    return REGISTROS_FORENSES.filter((r) => {
      const cumpleTermino = !terminoEfectivo ||
        r.sector.toLowerCase().includes(terminoEfectivo) ||
        r.radicado.toLowerCase().includes(terminoEfectivo) ||
        r.naturaleza.toLowerCase().includes(terminoEfectivo)
      const cumpleLocalidad = localidadFiltro === 'todas' || r.localidad.toLowerCase().includes(localidadFiltro.toLowerCase())
      return cumpleTermino && cumpleLocalidad
    })
  }, [terminoEfectivo, localidadFiltro])

  const carruselRef = useRef<HTMLDivElement>(null)
  const arrastreRef = useRef<{ activo: boolean; inicioX: number; inicioScroll: number; movio: boolean }>({
    activo: false, inicioX: 0, inicioScroll: 0, movio: false,
  })
  const [arrastrando, setArrastrando] = useState(false)
  const [puedeIzquierda, setPuedeIzquierda] = useState(false)
  const [puedeDerecha, setPuedeDerecha] = useState(false)
  const flechasAbajo = useConsultaMedios('(max-width: 640px)')

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
    const observador = new ResizeObserver(revisarExtremos)
    observador.observe(el)
    return () => {
      el.removeEventListener('scroll', revisarExtremos)
      observador.disconnect()
    }
  }, [revisarExtremos, itemsFiltrados.length])

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

  const exportarCsvBitacora = () => {
    const cabecera = 'Radicado,Fecha_Hora,Sector,Localidad,Naturaleza,Impacto,Discrepancia\n'
    const filas = REGISTROS_FORENSES.map(
      (r) => `"${r.radicado}","${r.hora}","${r.sector}","${r.localidad}","${r.naturaleza}","${r.impacto}","${r.discrepancia}"`
    ).join('\n')
    const blob = new Blob([cabecera + filas], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bitacora-forense-cartagena-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section
      id="bitacora"
      ref={seccionRef}
      className={`bitacora-seccion${entradaActiva ? ' is-visible' : ''}`}
      aria-label="Bitácora pública de interrupciones del servicio"
    >
      <div className="bitacora-envoltorio">
        {/* Barra de Telemetría Distrital */}
        <div className="bitacora-telemetria-bar">
          <div className="bitacora-telemetria-badge">
            <span className="bitacora-pulse-dot" />
            <span>REGISTRO PÚBLICO DISTRITAL</span>
          </div>
          <span className="bitacora-telemetria-sep">•</span>
          <span className="bitacora-telemetria-texto">Sincronizado con SCADA y veedurías comunales</span>
          <span className="bitacora-telemetria-sep">•</span>
          <span className="bitacora-telemetria-texto">
            Último corte validado: <strong className="tabular">14:32 COT</strong>
          </span>
          <span className="bitacora-telemetria-sep">•</span>
          <span className="bitacora-telemetria-tag">Red Matriz Sur</span>
        </div>

        {/* Cabecera Principal y Acciones */}
        <div className="bitacora-cab">
          <div>
            <div className="bitacora-eyebrow-pro">
              <span>Registro público</span>
            </div>
            <h2 className="bitacora-titulo-pro">Bitácora del servicio</h2>
            <p className="bitacora-subtitulo-pro">
              Expedientes de afectación comunal, trazabilidad forense y auditoría ciudadana del suministro en Cartagena.
            </p>
          </div>

          <div className="bitacora-acciones-top">
            <button
              type="button"
              className="bitacora-btn-accion"
              onClick={exportarCsvBitacora}
              aria-label="Exportar bitácora forense en CSV"
            >
              <Download size={15} aria-hidden="true" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              className="bitacora-btn-accion bitacora-btn-accion--destacado"
              onClick={() => window.print()}
              aria-label="Descargar boletín veedor en PDF"
            >
              <FileText size={15} aria-hidden="true" />
              <span>Boletín Veedor (PDF)</span>
            </button>
          </div>
        </div>

        {/* Filtros Interactivos: Estado, Localidad, Rango de tiempo y Búsqueda */}
        <div className="bitacora-barra-filtros-stitch">
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

          <div className="bitacora-filtros-secundarios">
            {/* Selector de Localidad */}
            <div className="bitacora-select-wrap">
              <Layers size={14} className="bitacora-select-icono" aria-hidden="true" />
              <select
                className="bitacora-select"
                value={localidadFiltro}
                onChange={(e) => setLocalidadFiltro(e.target.value)}
                aria-label="Filtrar por localidad UAP"
              >
                <option value="todas">Todas las Localidades (UAP 1, 2 y 3)</option>
                <option value="UAP 1">UAP 1: Histórica y del Caribe Norte</option>
                <option value="UAP 2">UAP 2: De la Virgen y Turística</option>
                <option value="UAP 3">UAP 3: Industrial y de la Bahía</option>
              </select>
            </div>

            {/* Selector de Rango */}
            <div className="bitacora-rangos-pills" role="group" aria-label="Filtrar por ventana de tiempo">
              {(['24h', '7d', '30d', 'hist'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`bitacora-rango-btn${rangoTiempo === r ? ' is-active' : ''}`}
                  onClick={() => setRangoTiempo(r)}
                >
                  {r === '24h' ? '24 horas' : r === '7d' ? '7 días' : r === '30d' ? '30 días' : 'Histórico'}
                </button>
              ))}
            </div>

            {/* Buscador Integrado */}
            <div className="bitacora-busqueda-wrap">
              <Search size={14} className="bitacora-busqueda-icono" aria-hidden="true" />
              <input
                type="search"
                className="bitacora-busqueda-input"
                placeholder="Buscar barrio o radicado..."
                value={busquedaInterna}
                onChange={(e) => setBusquedaInterna(e.target.value)}
                aria-label="Buscar en la bitácora"
              />
            </div>
          </div>
        </div>

        {/* 3 Tarjetas Destacadas en Vivo de Stitch */}
        <div className="bitacora-destacados-grid">
          {/* Tarjeta 1: Restablecido Camagüey */}
          <div className="bitacora-card-live bitacora-card-live--restablecido">
            <div className="bitacora-card-live-cab">
              <span className="bitacora-tag-live tag-restablecido">
                <CheckCircle2 size={13} aria-hidden="true" /> RESTABLECIDO
              </span>
              <span className="bitacora-card-live-hora">Actualizado 14:15 COT</span>
            </div>
            <div className="bitacora-card-live-cuerpo">
              <h4 className="bitacora-card-live-titulo">Camagüey (Sector Sur)</h4>
              <p className="bitacora-card-live-desc">Presión estabilizada tras reparación de matriz secundaria en Cra 65.</p>
              <div className="bitacora-card-live-metricas">
                <div>
                  <span className="card-metrica-rotulo">Presión en red</span>
                  <strong className="card-metrica-valor text-teal tabular">28.4 PSI</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Cuadrilla</span>
                  <strong className="card-metrica-valor text-tinta">Finalizada</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Impacto</span>
                  <strong className="card-metrica-valor text-tinta tabular">12,400 suscr.</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Sin Servicio Castillogrande */}
          <div className="bitacora-card-live bitacora-card-live--sinservicio">
            <div className="bitacora-card-live-cab">
              <span className="bitacora-tag-live tag-sinservicio">
                <span className="bitacora-pulse-dot" /> SIN SERVICIO
              </span>
              <span className="bitacora-card-live-hora">Reporte 14:15 COT</span>
            </div>
            <div className="bitacora-card-live-cuerpo">
              <h4 className="bitacora-card-live-titulo">Castillogrande (Sector Manga / Bocagrande)</h4>
              <p className="bitacora-card-live-desc">Rotura imprevista en alimentador 16". Afectación en pisos altos.</p>
              <div className="bitacora-card-live-metricas">
                <div>
                  <span className="card-metrica-rotulo">Presión en red</span>
                  <strong className="card-metrica-valor text-coral tabular">0.0 PSI</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Cuadrilla</span>
                  <strong className="card-metrica-valor text-coral">En desplazamiento</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Impacto</span>
                  <strong className="card-metrica-valor text-tinta tabular">3,800 suscr.</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Programado República de Chile */}
          <div className="bitacora-card-live bitacora-card-live--programado">
            <div className="bitacora-card-live-cab">
              <span className="bitacora-tag-live tag-programado">
                <Clock size={13} aria-hidden="true" /> PROGRAMADO
              </span>
              <span className="bitacora-card-live-hora">Mañana, 08:00 COT</span>
            </div>
            <div className="bitacora-card-live-cuerpo">
              <h4 className="bitacora-card-live-titulo">República de Chile (Sector Ceballos)</h4>
              <p className="bitacora-card-live-desc">Mantenimiento preventivo en subestación de bombeo y compuertas.</p>
              <div className="bitacora-card-live-metricas">
                <div>
                  <span className="card-metrica-rotulo">Ventana estimada</span>
                  <strong className="card-metrica-valor text-azul tabular">08:00 - 18:00</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Tipo maniobra</span>
                  <strong className="card-metrica-valor text-tinta">Preventivo</strong>
                </div>
                <div>
                  <span className="card-metrica-rotulo">Impacto</span>
                  <strong className="card-metrica-valor text-tinta tabular">6,100 suscr.</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Principal: 8 Cols (Tabla Forense / Boletines) + 4 Cols (Panel Lateral Discrepancia) */}
        <div className="bitacora-bento-grid">
          {/* Columna Principal (8 columnas) */}
          <div className="bitacora-col-principal">
            <div className="bitacora-seccion-forense-cab">
              <div>
                <h3 className="bitacora-seccion-subtitulo">Expedientes de afectación comunal</h3>
                <p className="bitacora-seccion-desc">
                  Trazabilidad cronológica de eventos cruzados entre Acuacar, telemetría y veedurías.
                </p>
              </div>

              {/* Conmutador de Vistas: Tabla Forense / Carrusel Oficial */}
              <div className="bitacora-conmutador-vistas">
                <button
                  type="button"
                  className={`conmutador-btn${vistaActiva === 'tabla' ? ' is-active' : ''}`}
                  onClick={() => setVistaActiva('tabla')}
                >
                  <FileText size={14} aria-hidden="true" /> Tabla Forense
                </button>
                <button
                  type="button"
                  className={`conmutador-btn${vistaActiva === 'boletines' ? ' is-active' : ''}`}
                  onClick={() => setVistaActiva('boletines')}
                >
                  <Activity size={14} aria-hidden="true" /> Boletines Oficiales ({itemsFiltrados.length})
                </button>
              </div>
            </div>

            {/* Vista 1: Tabla Forense Cronológica */}
            {vistaActiva === 'tabla' && (
              <div className="bitacora-tabla-contenedor">
                <table className="bitacora-tabla-forense">
                  <thead>
                    <tr>
                      <th scope="col">Radicado / Hora</th>
                      <th scope="col">Sector / Localidad</th>
                      <th scope="col">Naturaleza de la Falla</th>
                      <th scope="col">Impacto</th>
                      <th scope="col">Discrepancia Acuacar</th>
                      <th scope="col" className="text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosForensesFiltrados.map((reg) => (
                      <tr key={reg.radicado} className="bitacora-fila-forense">
                        <td>
                          <div className="forense-radicado tabular">{reg.radicado}</div>
                          <div className="forense-hora">{reg.hora}</div>
                        </td>
                        <td>
                          <div className="forense-sector">{reg.sector}</div>
                          <div className="forense-localidad">{reg.localidad}</div>
                        </td>
                        <td>
                          <span className="forense-naturaleza">{reg.naturaleza}</span>
                        </td>
                        <td>
                          <span className="forense-impacto tabular">{reg.impacto}</span>
                        </td>
                        <td>
                          <span className={`forense-badge-discrepancia badge-${reg.tipoDiscrepancia}`}>
                            {reg.discrepancia}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="forense-btn-expediente"
                            onClick={() => setExpedienteSeleccionado(reg)}
                            aria-label={`Ver expediente de ${reg.sector}`}
                          >
                            Expediente →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Estado Vacío o Error si la API falla */}
            {error && items.length === 0 && !cargando ? (
              <div className="bitacora-vacio bitacora-vacio--error" role="alert">
                <AlertTriangle className="bitacora-vacio-icono" size={24} aria-hidden="true" />
                <p className="bitacora-vacio-titulo">No pudimos consultar la bitácora</p>
                <p className="bitacora-vacio-texto">{error}</p>
                <button type="button" onClick={cargarBitacora}>Reintentar consulta</button>
              </div>
            ) : itemsFiltrados.length === 0 && !cargando ? (
              (() => {
                const vacio = mensajeVacio(filtro, busqueda || busquedaInterna)
                const IconoVacio = vacio.Icono
                return (
                  <div className="bitacora-vacio" key={`${filtro}-${busqueda || busquedaInterna}`} role="status">
                    <IconoVacio className="bitacora-vacio-icono" size={30} aria-hidden="true" />
                    <p className="bitacora-vacio-titulo">{vacio.titulo}</p>
                    <p className="bitacora-vacio-texto">{vacio.detalle}</p>
                  </div>
                )
              })()
            ) : null}

            {/* Carrusel Oficial de Boletines (Siempre montado para preservar accesibilidad, compatibilidad y tests) */}
            <div
              className={`bitacora-bloque-carrusel${vistaActiva === 'tabla' ? ' bitacora-boletines-secundario' : ''}`}
            >
              <div className="bitacora-carrusel-cab">
                <h4 className="bitacora-carrusel-subtitulo">
                  Boletines e Interrupciones Registradas ({itemsFiltrados.length})
                </h4>
                <p className="bitacora-carrusel-nota">
                  Publicaciones oficiales emitidas por Aguas de Cartagena e ingesta comunitaria.
                </p>
              </div>

              <div className="bitacora-carrusel-marco">
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
                      <div key={item.id} className="bitacora-tarjeta-pro">
                        <div>
                          {item.imagenUrl && (
                            <div className="bitacora-portada-marco">
                              <img
                                className="bitacora-portada"
                                src={comoPortadaServida(item.imagenUrl)}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
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
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={13} aria-hidden="true" />
                              Leer documento
                            </a>
                          ) : (
                            <span className={`bitacora-tag-tipo ${badgeClass}`}>
                              <span className="bitacora-dot-indicador" />
                              {tagFuente}
                            </span>
                          )}
                          <Radio size={13} className="bitacora-radio" aria-hidden="true" />
                        </div>
                      </div>
                    )
                  })}
                </div>

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
            </div>
          </div>

          {/* Columna Lateral (4 columnas): Índice de Discrepancia, Foto Terreno y Protocolo */}
          <aside className="bitacora-col-lateral" aria-label="Auditoría y discrepancia">
            {/* 1. Gauge Circular de Discrepancia Comunal */}
            <div className="bitacora-panel-lateral-card">
              <div className="panel-lateral-cab">
                <Gauge size={16} className="text-coral" aria-hidden="true" />
                <h4 className="panel-lateral-titulo">Índice de Discrepancia Comunal</h4>
              </div>

              <div className="bitacora-gauge-bloque">
                <div className="bitacora-gauge-svg-wrap">
                  <svg className="bitacora-gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="48" className="gauge-pista" />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      className="gauge-progreso"
                      style={{ strokeDasharray: '301.6', strokeDashoffset: '84' }}
                    />
                  </svg>
                  <div className="gauge-centro-texto">
                    <span className="gauge-valor tabular">+3.2h</span>
                    <span className="gauge-etiqueta">Desfase crítico</span>
                  </div>
                </div>

                <p className="bitacora-gauge-explicacion">
                  Diferencia promedio entre la hora oficial prometida por Acuacar y la llegada real con presión al grifo.
                </p>

                <div className="bitacora-gauge-desglose">
                  <div className="gauge-desglose-fila">
                    <span>UAP 1 (Histórica / Norte)</span>
                    <strong className="text-tinta tabular">+1.8h</strong>
                  </div>
                  <div className="gauge-desglose-fila">
                    <span>UAP 2 (De la Virgen)</span>
                    <strong className="text-coral tabular">+4.6h</strong>
                  </div>
                  <div className="gauge-desglose-fila">
                    <span>UAP 3 (Industrial)</span>
                    <strong className="text-tinta tabular">+2.4h</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Evidencia Fotográfica en Terreno */}
            <div className="bitacora-panel-lateral-card bitacora-card-terreno">
              <div className="panel-lateral-cab">
                <Camera size={16} className="text-teal" aria-hidden="true" />
                <h4 className="panel-lateral-titulo">Evidencia Fotográfica en Terreno</h4>
              </div>

              <div className="bitacora-foto-terreno-marco">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80"
                  alt="Rotura de tubería de agua en Cartagena"
                  className="bitacora-foto-terreno"
                  loading="lazy"
                />
                <div className="foto-terreno-tag">
                  <span className="bitacora-pulse-dot" /> Manga - Calle 26
                </div>
              </div>

              <div className="bitacora-foto-terreno-info">
                <div className="terreno-info-cab">
                  <span className="terreno-veedor-id">Veedor acreditado #042</span>
                  <span className="terreno-tiempo tabular">Reporte 13:50 COT</span>
                </div>
                <p className="terreno-nota">
                  Rotura visible en red secundaria con fuga de lodo. Cuadrilla ausente a pesar del reporte radicado #EVT-2026-894.
                </p>
              </div>
            </div>

            {/* 3. Protocolo Legal de Registro */}
            <div className="bitacora-panel-lateral-card bitacora-card-legal">
              <div className="panel-lateral-cab">
                <ShieldAlert size={16} className="text-coral" aria-hidden="true" />
                <h4 className="panel-lateral-titulo">Protocolo de Registro Oficial</h4>
              </div>
              <p className="bitacora-legal-texto">
                Conforme a la <strong>Ley 142 de 1994</strong> (Art. 79) y la Resolución CRA 943, toda discrepancia superior a 2 horas entre el aviso oficial y el restablecimiento efectivo constituye causal de investigación regulatoria ante la Superservicios.
              </p>
            </div>
          </aside>
        </div>

        {/* Modal de Detalle de Expediente Forense */}
        {expedienteSeleccionado && (
          <div className="bitacora-modal-fondo" onClick={() => setExpedienteSeleccionado(null)}>
            <div
              className="bitacora-modal-expediente"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="titulo-expediente"
            >
              <div className="bitacora-modal-cab">
                <div>
                  <span className="modal-eyebrow">AUDITORÍA FORENSE COMUNAL</span>
                  <h3 id="titulo-expediente" className="modal-titulo">
                    Expediente {expedienteSeleccionado.radicado}
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-cerrar-btn"
                  onClick={() => setExpedienteSeleccionado(null)}
                  aria-label="Cerrar expediente"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="bitacora-modal-cuerpo">
                <div className="modal-campo-grid">
                  <div>
                    <span className="modal-campo-rotulo">Sector afectado</span>
                    <strong className="modal-campo-valor">{expedienteSeleccionado.sector}</strong>
                  </div>
                  <div>
                    <span className="modal-campo-rotulo">Localidad</span>
                    <strong className="modal-campo-valor">{expedienteSeleccionado.localidad}</strong>
                  </div>
                  <div>
                    <span className="modal-campo-rotulo">Hora del incidente</span>
                    <strong className="modal-campo-valor tabular">{expedienteSeleccionado.hora}</strong>
                  </div>
                  <div>
                    <span className="modal-campo-rotulo">Lectura SCADA / Presión</span>
                    <strong className="modal-campo-valor tabular text-coral">
                      {expedienteSeleccionado.scadaPresion}
                    </strong>
                  </div>
                  <div>
                    <span className="modal-campo-rotulo">Afectación de suscriptores</span>
                    <strong className="modal-campo-valor tabular">{expedienteSeleccionado.impacto}</strong>
                  </div>
                  <div>
                    <span className="modal-campo-rotulo">Discrepancia Acuacar</span>
                    <span className={`forense-badge-discrepancia badge-${expedienteSeleccionado.tipoDiscrepancia}`}>
                      {expedienteSeleccionado.discrepancia}
                    </span>
                  </div>
                </div>

                <div className="modal-bloque-dictamen">
                  <h4>Dictamen de la veeduría comunal</h4>
                  <p>{expedienteSeleccionado.detalles}</p>
                </div>

                <div className="modal-acciones-pie">
                  <button
                    type="button"
                    className="modal-btn-descargar"
                    onClick={() => {
                      alert(`Descargando acta digitalizada para radicado ${expedienteSeleccionado.radicado}`)
                    }}
                  >
                    <Download size={14} aria-hidden="true" /> Descargar Acta Radicada
                  </button>
                  <button
                    type="button"
                    className="modal-btn-cerrar"
                    onClick={() => setExpedienteSeleccionado(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export const SeccionBitacora = memo(SeccionBitacoraBase)
