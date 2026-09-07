/**
 * PaginaMapa — M1 (Mapa en vivo) + lista accesible (RF004) + Bitácora (M8) + Estadísticas (M7).
 *
 * Alternativa "mapa completo": sin sidebar/topbar fijos, el mapa ocupa la primera pantalla
 * (hero) y la navegación (NavegacionFlotante), el buscador, el resumen y la lista de
 * sectores flotan encima. Solo esta página usa este chrome — el resto sigue con Encabezado
 * (ver App.tsx). Debajo del hero, con scroll, viven la Bitácora y las Estadísticas — ya no
 * son rutas aparte (/bitacora, /estadisticas): todo lo que antes eran páginas satélite del
 * mapa ahora es la misma página principal, para que no haya que "ir a otro lado" a verlo.
 *
 * Conectado al backend real vía useDatosEnVivo (GET /api/sectores + SSE /api/sectores/stream).
 * Los boletines de Acuacar son solo contexto complementario en la ficha de un sector — ver
 * PanelDetalleSector y la nota en useDatosEnVivo.ts.
 *
 * DESIGN.md §1: responde "¿tengo agua?" en menos de 5 segundos.
 */
import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import type { FC } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Compass,
  Database,
  MapPin,
  Menu,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { MapaCartagena } from '../components/MapaCartagena'
import { BuscadorBarrios } from '../components/BuscadorBarrios'
import { CarruselSector } from '../components/CarruselSector/CarruselSector'
import { ModalReporte } from '../components/ModalReporte'
import { ModalSuscripcion } from '../components/ModalSuscripcion'
import { LlamadoVeedor } from '../components/LlamadoVeedor'
import { NavegacionFlotante } from '../components/NavegacionFlotante'
import { PanelProyecto } from '../components/PanelProyecto'
import { PieDePagina } from '../components/PieDePagina'
import { TarjetasEstadoMapa } from '../components/TarjetasEstadoMapa'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import type { EstadoRecurso } from '../hooks/useDatosEnVivo'
import type { useTheme } from '../hooks/useTheme'
import './PaginaMapa.css'

// Cargados aparte del bundle de esta página, no antes de que haga falta: los tres arrastran
// `recharts` (SeccionEstadisticas y PanelDetalleSector, por su mini-gráfica de cumplimiento) o
// van bajo el pliegue (SeccionBitacora). RNF001 medía 715 KB en un solo chunk sin dividir.
const PanelDetalleSector = lazy(() => import('../components/PanelDetalleSector').then((m) => ({ default: m.PanelDetalleSector })))
const SeccionBitacora = lazy(() => import('../components/SeccionBitacora').then((m) => ({ default: m.SeccionBitacora })))
const SeccionEstadisticas = lazy(() => import('../components/SeccionEstadisticas').then((m) => ({ default: m.SeccionEstadisticas })))
const SeccionVeedor = lazy(() => import('../components/SeccionVeedor').then((m) => ({ default: m.SeccionVeedor })))

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

interface EstadoConsultaMapaProps {
  estado: EstadoRecurso
  error: string | null
  onRecargar: () => void
}

const EstadoConsultaMapa: FC<EstadoConsultaMapaProps> = ({ estado, error, onRecargar }) => {
  if (estado === 'success') return null

  if (estado === 'loading') {
    return (
      <div className="estado-consulta-mapa estado-consulta-mapa--cargando" role="status">
        <span className="estado-consulta-mapa-indicador" aria-hidden="true" />
        <div>
          <strong>Consultando el estado del servicio</strong>
          <p>Estamos leyendo la información más reciente de los barrios.</p>
        </div>
      </div>
    )
  }

  if (estado === 'stale') {
    return (
      <div className="estado-consulta-mapa estado-consulta-mapa--aviso" role="status">
        <WifiOff size={18} aria-hidden="true" />
        <div>
          <strong>Mostrando la última información disponible</strong>
          <p>La actualización en vivo está interrumpida. Puedes intentar reconectar.</p>
        </div>
        <button type="button" onClick={onRecargar} aria-label="Reintentar consulta">
          <RefreshCw size={16} aria-hidden="true" />
          Reintentar
        </button>
      </div>
    )
  }

  if (estado === 'empty') {
    return (
      <div className="estado-consulta-mapa" role="status">
        <Database size={20} aria-hidden="true" />
        <div>
          <strong>Sin estados recientes publicados</strong>
          <p>La cartografía sigue disponible, pero la API no entregó estados vigentes.</p>
        </div>
        <button type="button" onClick={onRecargar} aria-label="Reintentar consulta">
          <RefreshCw size={16} aria-hidden="true" />
          Actualizar
        </button>
      </div>
    )
  }

  return (
    <div className="estado-consulta-mapa estado-consulta-mapa--error" role="alert">
      <AlertTriangle size={20} aria-hidden="true" />
      <div>
        <strong>Información no disponible</strong>
        <p>{error || 'No pudimos consultar el estado de los barrios en este momento.'}</p>
      </div>
      <button type="button" onClick={onRecargar} aria-label="Reintentar consulta">
        <RefreshCw size={16} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}

const PaginaMapa: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const {
    estado,
    sectores,
    cargando,
    error,
    ultimaActualizacion,
    conexionViva,
    boletines,
    recargar,
  } = useDatosEnVivo()

  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [suscripcionAbierta, setSuscripcionAbierta] = useState(false)
  const [loginVeedorAbierto, setLoginVeedorAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroPanel, setFiltroPanel] = useState<'estado' | 'sector'>('estado')
  const [direccionCarrusel, setDireccionCarrusel] = useState(1)
  const [panelColapsado, setPanelColapsado] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<'mapa' | 'bitacora' | 'estadisticas' | 'veedor'>('mapa')
  const [estadoDestacado, setEstadoDestacado] = useState<EstadoServicio | null>(null)
  const hayResumenConfiable = (estado === 'success' || estado === 'stale')
    && sectores.some((sector) => sector.estado !== null)

  const conteos = [
    { estado: 'SIN_SERVICIO' as const, n: sectores.filter(s => s.estado === 'SIN_SERVICIO').length },
    { estado: 'PRESION_BAJA' as const, n: sectores.filter(s => s.estado === 'PRESION_BAJA').length },
    { estado: 'CORTE_PROGRAMADO' as const, n: sectores.filter(s => s.estado === 'CORTE_PROGRAMADO').length },
    { estado: 'CON_SERVICIO' as const, n: sectores.filter(s => s.estado === 'CON_SERVICIO').length },
  ]

  const alSeleccionarSector = useCallback((sector: Sector | null) => {
    setDireccionCarrusel(sector ? 1 : -1)
    setSectorActivo(sector)
  }, [])

  // "Ver en el mapa" es un interruptor: tocar la misma tarjeta otra vez apaga el foco y
  // MapaCartagena vuelve a la vista general (ver dibujarDestacado).
  const alAlternarEstadoDestacado = useCallback((estado: EstadoServicio) => {
    setEstadoDestacado((actual) => (actual === estado ? null : estado))
  }, [])

  // Llegar con "/#bitacora" o "/#estadisticas" (desde el navbar en otra página, o un
  // enlace externo) hace scroll hasta esa sección — react-router no hace este scroll
  // solo al cambiar el hash. Y al volver a "/" sin hash (botón "Mapa en vivo" desde otra
  // sección) hay que devolver el scroll arriba a mano por la misma razón: sin esto el
  // cambio de URL ocurre pero la página se queda donde estaba, y el botón "no hace nada".
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        const timer = setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 200)
        return () => clearTimeout(timer)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash])

  // Sombrea el enlace del navbar según la sección visible, al hacer scroll y no solo al pulsar.
  // Se calcula cuál es la activa en vez de dejar que gane la última que avisó.
  //
  // Antes esto lo resolvía un IntersectionObserver que hacía `setSeccionActiva` por cada entrada
  // que entrara en cuadro. Con varias secciones cruzando la franja durante un desplazamiento
  // suave, el resultado dependía del orden en que el navegador entregaba las entradas, y "Panel
  // veedor" se quedaba encendido después de pulsar otro enlace. Ahora la respuesta sale de la
  // posición real: la última sección cuyo borde superior ya pasó por debajo del navbar.
  useEffect(() => {
    const secciones: Array<{ id: string; seccion: 'mapa' | 'bitacora' | 'estadisticas' | 'veedor' }> = [
      { id: 'mapa', seccion: 'mapa' },
      { id: 'bitacora', seccion: 'bitacora' },
      { id: 'estadisticas', seccion: 'estadisticas' },
      { id: 'veedor', seccion: 'veedor' },
    ]

    let pendiente = false
    const recalcular = () => {
      pendiente = false
      let activa: typeof secciones[number]['seccion'] = 'mapa'
      for (const { id, seccion } of secciones) {
        const el = document.getElementById(id)
        // 120px tiene que ir por encima del `scroll-margin-top: 110px` de las anclas (index.css):
        // al saltar a una sección, esta queda con su borde a 110px, y con un umbral menor el
        // navbar seguía marcando la sección anterior justo después de pulsar su enlace.
        if (el && el.getBoundingClientRect().top <= 120) activa = seccion
      }
      setSeccionActiva(activa)
    }

    // rAF y no un temporizador: el cálculo lee `getBoundingClientRect`, así que conviene hacerlo
    // justo antes de pintar y una sola vez por cuadro, no una vez por evento de scroll.
    const alDesplazar = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(recalcular)
    }

    recalcular()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      window.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
    }
  }, [])

  return (
    <div className="pagina-principal">
      <NavegacionFlotante
        temaActivo={temaActivo}
        onAlternarTema={onAlternarTema}
        seccionActiva={seccionActiva}
        onReportar={() => {
          setSectorReporte('')
          setModalAbierto(true)
        }}
      />

      <main id="contenido-principal" tabIndex={-1} aria-label="Mapa en vivo del servicio de agua en Cartagena">
      <section id="mapa" className="mapa-vista-completa" aria-label="Mapa en vivo">
        <div className={`panel-mapa-unificado${panelColapsado ? ' panel-mapa-unificado--colapsado' : ''}`}>
          <div className="mapa-lienzo-completo">
            <MapaCartagena
              sectores={sectores}
              cargando={cargando}
              ultimaActualizacion={ultimaActualizacion}
              conexionViva={conexionViva}
              sectorActivo={sectorActivo}
              estadoDestacado={estadoDestacado}
              onSectorSeleccionado={alSeleccionarSector}
            />

            {/* Floating Breadcrumb & Quick Filter Pills */}
            <div className="mapa-flotante-filtros" aria-label="Filtros rápidos del mapa">
              <div className="mapa-breadcrumb-capsula">
                <Compass size={14} aria-hidden="true" />
                <span className="mapa-breadcrumb-titulo">Cartagena, barrio por barrio</span>
                <span className="mapa-breadcrumb-sep" aria-hidden="true">•</span>
                <span className="mapa-breadcrumb-sub">Datos publicados por las fuentes conectadas</span>
              </div>
              <div className="mapa-pills-rapidos" role="toolbar" aria-label="Filtro rápido por estado">
                <button
                  type="button"
                  className={`mapa-pill-rapido${!estadoDestacado ? ' is-activo' : ''}`}
                  onClick={() => setEstadoDestacado(null)}
                >
                  Barrios ({sectores.length || '—'})
                </button>
                <button
                  type="button"
                  className={`mapa-pill-rapido mapa-pill-rapido--sin-servicio${estadoDestacado === 'SIN_SERVICIO' ? ' is-activo' : ''}`}
                  onClick={() => alAlternarEstadoDestacado('SIN_SERVICIO')}
                  disabled={!hayResumenConfiable}
                >
                  <span className="pulse-dot-red" aria-hidden="true" />
                  Sin servicio ({hayResumenConfiable ? (conteos.find((c) => c.estado === 'SIN_SERVICIO')?.n ?? 0) : '—'})
                </button>
                <button
                  type="button"
                  className={`mapa-pill-rapido mapa-pill-rapido--baja-presion${estadoDestacado === 'PRESION_BAJA' ? ' is-activo' : ''}`}
                  onClick={() => alAlternarEstadoDestacado('PRESION_BAJA')}
                  disabled={!hayResumenConfiable}
                >
                  <span className="pulse-dot-coral" aria-hidden="true" />
                  Baja presión ({hayResumenConfiable ? (conteos.find((c) => c.estado === 'PRESION_BAJA')?.n ?? 0) : '—'})
                </button>
              </div>
            </div>

          </div>

          {/* Esquina superior derecha del MARCO, no de la columna — vive fuera de
              .hoja-sectores a propósito: esa columna se recorta con overflow:hidden al
              colapsar, así que un botón adentro desaparecería con ella y no habría forma
              de reabrirla. Un solo ícono para los dos estados (no cambia a una flecha o
              equivalente): lo que comunica el cambio es la columna misma, apareciendo o
              desapareciendo — el aria-label/title sí cambian para quien usa lector de
              pantalla o pasa el mouse. */}
          <button
            type="button"
            className="boton-colapsar-panel"
            onClick={() => setPanelColapsado((c) => !c)}
            aria-label={panelColapsado ? 'Mostrar columna de sectores' : 'Ocultar columna de sectores'}
            title={panelColapsado ? 'Mostrar columna' : 'Ocultar columna'}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          {/* inert (no solo aria-hidden): al colapsar, la columna deja de estar en el árbol
              de accesibilidad Y sale del orden de tabulación — con solo aria-hidden el
              teclado seguiría entrando a un buscador o unos botones invisibles. */}
          <aside
            className="hoja-sectores"
            aria-label="Resumen y lista de sectores"
            inert={panelColapsado || undefined}
          >
            <div className="hoja-sectores-cab mapa-resumen">
              <p className="mapa-panel-codigo">VEEDURÍA CIUDADANA · CARTAGENA</p>
              <h1 className="mapa-titulo">Lectura del servicio</h1>
              <p className="mapa-subtitulo">
                Consulta el estado general o busca tu barrio directamente.
              </p>

              {/* Puramente decorativo — ya no es el estado "vacío" de PanelDetalleSector (ese
                  branch se eliminó). No reacciona a nada: mismo texto de siempre, reubicado
                  aquí arriba de las pestañas como una pista fija de cómo usar el panel. */}
              <p className="hoja-sectores-pista">
                <MapPin size={13} aria-hidden="true" />
                Selecciona un sector para abrir su ficha
              </p>

              <div className="filtro-panel-tabs">
                <button
                  type="button"
                  className={filtroPanel === 'estado' ? 'activo' : ''}
                  aria-pressed={filtroPanel === 'estado'}
                  onClick={() => {
                    setDireccionCarrusel(-1)
                    setFiltroPanel('estado')
                  }}
                >
                  Por estado
                </button>
                <button
                  type="button"
                  className={filtroPanel === 'sector' ? 'activo' : ''}
                  aria-pressed={filtroPanel === 'sector'}
                  onClick={() => {
                    setDireccionCarrusel(1)
                    setFiltroPanel('sector')
                  }}
                >
                  Por sector
                </button>
              </div>
            </div>

            {/* Carrusel: anima CUALQUIER cambio de contenido del panel — alternar pestaña
                (tarjetas ↔ buscador) o elegir/cerrar un sector (↔ ficha de detalle) — con
                el deslizamiento de reactbits.dev/Carousel (ver CarruselSector). `vista`
                identifica qué se muestra; cambiarla es lo único que dispara la animación. */}
            <div className="hoja-sectores-cuerpo">
              <EstadoConsultaMapa estado={estado} error={error} onRecargar={recargar} />
              {/* Centrado solo para las tarjetas — el buscador y la ficha de detalle van
                  arriba (ver .carrusel-sector--centrado en index.css). */}
              <CarruselSector
                className={`carrusel-sector${filtroPanel === 'estado' && !sectorActivo ? ' carrusel-sector--centrado' : ''}`}
                vista={sectorActivo ? 'detalle' : filtroPanel}
                direccion={direccionCarrusel}
              >
                {sectorActivo ? (
                  <Suspense fallback={null}>
                    <PanelDetalleSector
                      key={sectorActivo.id}
                      sector={sectorActivo}
                      boletines={boletines}
                      onCerrar={() => alSeleccionarSector(null)}
                      onAbrirReporte={(id) => {
                        setSectorReporte(id)
                        setModalAbierto(true)
                      }}
                    />
                  </Suspense>
                ) : filtroPanel === 'estado' && hayResumenConfiable ? (
                  <TarjetasEstadoMapa
                    resumen={conteos}
                    estadoDestacado={estadoDestacado}
                    onAlternar={alAlternarEstadoDestacado}
                    onAlternarBitacora={() => document.getElementById('bitacora')?.scrollIntoView({ behavior: 'smooth' })}
                  />
                ) : filtroPanel === 'sector' ? (
                  <BuscadorBarrios
                    sectores={sectores}
                    busqueda={busqueda}
                    onCambiarBusqueda={setBusqueda}
                    cargando={cargando}
                    error={error}
                    onSectorSeleccionado={alSeleccionarSector}
                  />
                ) : null}
              </CarruselSector>
            </div>

            {/* Footer del Drawer lateral */}
            <div className="hoja-sectores-pie">
              <span className="hoja-sectores-pie-actualizado">
                <span className={hayResumenConfiable && conexionViva ? 'pulse-dot-emerald' : 'pulse-dot-amber'} aria-hidden="true" />
                {estado === 'loading'
                  ? 'Consultando datos'
                  : !hayResumenConfiable
                    ? 'Sin estados recientes'
                    : conexionViva
                    ? 'Conexión en vivo activa'
                    : ultimaActualizacion
                      ? 'Última información disponible'
                      : 'Sin datos publicados'}
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="seccion-proyecto" aria-label="Sobre AguaVigía">
        <PanelProyecto onSuscribirse={() => setSuscripcionAbierta(true)} />
      </section>

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando bitácora…</div>}>
        <SeccionBitacora />
      </Suspense>

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando estadísticas…</div>}>
        <SeccionEstadisticas />
      </Suspense>

      <LlamadoVeedor
        onSuscribirse={() => setSuscripcionAbierta(true)}
        onAbrirPanel={() => setLoginVeedorAbierto(true)}
      />

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando veeduría…</div>}>
        <SeccionVeedor
          loginAbierto={loginVeedorAbierto}
          onCerrarLogin={() => setLoginVeedorAbierto(false)}
        />
      </Suspense>

      </main>
      <PieDePagina />

      {modalAbierto && (
        <ModalReporte
          abierto
          alCerrar={() => setModalAbierto(false)}
          sectores={sectores}
          sectorPreseleccionado={sectorReporte}
        />
      )}

      <ModalSuscripcion
        abierto={suscripcionAbierta}
        onCerrar={() => setSuscripcionAbierta(false)}
        sectores={sectores}
        estadoDatos={estado}
        errorDatos={error}
        onRecargarDatos={recargar}
      />
    </div>
  )
}

export default PaginaMapa
