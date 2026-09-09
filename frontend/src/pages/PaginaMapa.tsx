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
import { ChevronDown, MapPin, Menu, Radio, SatelliteDish } from 'lucide-react'
import { MapaCartagena } from '../components/MapaCartagena'
import { BuscadorBarrios } from '../components/BuscadorBarrios'
import { CarruselSector } from '../components/CarruselSector/CarruselSector'
import { ModalReporte } from '../components/ModalReporte'
import { ModalSuscripcion } from '../components/ModalSuscripcion'
import { LlamadoVeedor } from '../components/LlamadoVeedor'
import { NavegacionFlotante } from '../components/NavegacionFlotante'
import { PanelProyecto } from '../components/PanelProyecto'
import { GradientWaves } from '../components/GradientWaves/GradientWaves'
import { PieDePagina } from '../components/PieDePagina'
import { TarjetasEstadoMapa } from '../components/TarjetasEstadoMapa'
import { EtiquetaFrescura } from '../components/EtiquetaFrescura'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { useConsultaMedios } from '../hooks/useConsultaMedios'
import { desplazarAlMapa } from '../utils/desplazarAlMapa'
import type { useTheme } from '../hooks/useTheme'
import '../AguaVigiaDesktop.css'

// Cargados aparte del bundle de esta página, no antes de que haga falta: los tres arrastran
// `recharts` (SeccionEstadisticas y PanelDetalleSector, por su mini-gráfica de cumplimiento) o
// van bajo el pliegue (SeccionBitacora). RNF001 medía 715 KB en un solo chunk sin dividir.
const PanelDetalleSector = lazy(() => import('../components/PanelDetalleSector').then((m) => ({ default: m.PanelDetalleSector })))
const SeccionBitacora = lazy(() => import('../components/SeccionBitacora').then((m) => ({ default: m.SeccionBitacora })))
const SeccionEstadisticas = lazy(() => import('../components/SeccionEstadisticas').then((m) => ({ default: m.SeccionEstadisticas })))
const SeccionVeedor = lazy(() => import('../components/SeccionVeedor').then((m) => ({ default: m.SeccionVeedor })))

type ThemeProps = ReturnType<typeof useTheme>

// El mismo corte con el que index.css oculta `.panel-proyecto`: por debajo de 1024px ya no
// cabe flotando junto al mapa, así que el panel se monta como portada, encima del hero.
const CORTE_PORTADA = '(max-width: 1024px)'

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const PaginaMapa: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const {
    sectores,
    cargando,
    error,
    estado: estadoDatos,
    ultimaActualizacion,
    conexionViva,
    boletines,
    estadoAcuacar,
    recargarAcuacar,
  } = useDatosEnVivo();

  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [suscripcionAbierta, setSuscripcionAbierta] = useState(false)
  const [loginVeedorAbierto, setLoginVeedorAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroPanel, setFiltroPanel] = useState<'estado' | 'sector'>('estado')
  const [direccionCarrusel, setDireccionCarrusel] = useState(1)
  const [panelColapsado, setPanelColapsado] = useState(false)
  const [busquedaBitacora, setBusquedaBitacora] = useState<string>('')
  const [seccionActiva, setSeccionActiva] = useState<'mapa' | 'bitacora' | 'estadisticas' | 'veedor'>('mapa')
  const [estadoDestacado, setEstadoDestacado] = useState<EstadoServicio | null>(null)
  const hayPortada = useConsultaMedios(CORTE_PORTADA)

  const conteos = [
    { estado: 'SIN_SERVICIO' as const, n: sectores.filter(s => s.estado === 'SIN_SERVICIO').length },
    { estado: 'PRESION_BAJA' as const, n: sectores.filter(s => s.estado === 'PRESION_BAJA').length },
    { estado: 'CORTE_PROGRAMADO' as const, n: sectores.filter(s => s.estado === 'CORTE_PROGRAMADO').length },
    { estado: 'CON_SERVICIO' as const, n: sectores.filter(s => s.estado === 'CON_SERVICIO').length },
  ]
  const sectoresConEstado = sectores.filter((sector) => sector.estado !== null)
  const porcentajeOperativo = sectoresConEstado.length === 0
    ? null
    : Math.round((sectoresConEstado.filter((sector) => sector.estado !== 'SIN_SERVICIO').length / sectoresConEstado.length) * 100)

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
    <main id="contenido-principal" tabIndex={-1} role="main" aria-label="Mapa en vivo del servicio de agua en Cartagena" className={`pagina-principal tema-${temaActivo}`}>
      <NavegacionFlotante
        temaActivo={temaActivo}
        onAlternarTema={onAlternarTema}
        seccionActiva={seccionActiva}
        busquedaBitacora={busquedaBitacora}
        onCambiarBusquedaBitacora={setBusquedaBitacora}
        onReportar={() => {
          setSectorReporte('')
          setModalAbierto(true)
        }}
        porcentajeOperativo={porcentajeOperativo}
        conexionViva={conexionViva}
      />

      {/* Portada de teléfono y tableta. En escritorio este mismo panel flota a la izquierda,
          DENTRO del hero, y se ve a la vez que el mapa; por debajo de 1024px no cabe al lado,
          así que pasa a ser la primera pantalla y el mapa queda a un scroll. Va montado aquí
          y no dentro de GradientWaves porque el contenedor de las olas es `inset: 0` sobre el
          hero: meter contenido en flujo ahí obligaría a estirar el shader a dos pantallas, y
          en un gama media eso se paga en cada cuadro (DESIGN.md §8). */}
      {hayPortada && (
        <section className="portada-movil" aria-label="AguaVigía CTG">
          <PanelProyecto onSuscribirse={() => setSuscripcionAbierta(true)} />
          <button type="button" className="portada-movil-bajar" onClick={desplazarAlMapa}>
            <span>Ver el mapa</span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* GradientWaves es el fondo del hero; el recuadro unificado (mapa + panel de sectores)
          va anidado DENTRO de su contenedor para que el pointermove del efecto siga
          llegando aunque el div de Leaflet lo cubra visualmente por completo — el evento
          burbujea hacia arriba. Mapa y panel comparten un solo marco: un borde, una sombra,
          unas esquinas — no dos piezas flotando por separado. */}
      <section id="mapa" className="mapa-vista-completa" aria-label="Mapa en vivo">
      <GradientWaves
        className="gradient-waves-costera"
        horizonColor="#071724"
        waveColor="#0284c7"
        crestColor="#78d9db"
        opacity={0.34}
      >
        {!hayPortada && <PanelProyecto onSuscribirse={() => setSuscripcionAbierta(true)} />}

        {!hayPortada && (
          <div className="mapa-modulo-cabecera">
            <div>
              <span className="mapa-modulo-badge">
                <SatelliteDish size={13} aria-hidden="true" />
                Observatorio ciudadano • Cartagena de Indias
              </span>
              <h1>Cartagena, barrio por barrio</h1>
              <p>Boletines oficiales de Acuacar y reportes comunitarios validados en un mismo mapa.</p>
            </div>
            <div className="mapa-modulo-sincronizacion">
              <span className={`mapa-modulo-en-vivo${conexionViva ? ' is-live' : ''}`}>
                <Radio size={13} aria-hidden="true" />
                {conexionViva ? 'Actualización en vivo' : 'Reconectando'}
              </span>
              <EtiquetaFrescura timestampIso={ultimaActualizacion} conexionViva={conexionViva} />
            </div>
          </div>
        )}

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
              <span className="mapa-panel-eyebrow">OBSERVATORIO BARRIAL</span>
              <h2 className="mapa-titulo">Lectura del servicio</h2>
              <p className="mapa-subtitulo">
                {estadoDatos === 'success'
                  ? 'Estado verificado por barrio con los datos actuales de AguaVigía.'
                  : estadoDatos === 'loading'
                    ? 'Consultando el estado validado de los barrios…'
                    : 'Esperando conexión con el servicio de datos de AguaVigía.'}
              </p>

              {/* Puramente decorativo — ya no es el estado "vacío" de PanelDetalleSector (ese
                  branch se eliminó). No reacciona a nada: mismo texto de siempre, reubicado
                  aquí arriba de las pestañas como una pista fija de cómo usar el panel. */}
              <p className="hoja-sectores-pista">
                <MapPin size={13} aria-hidden="true" />
                Selecciona un sector para ver su información
              </p>

              <div className="filtro-panel-tabs">
                <div className="filtro-panel-tabs-lista" role="tablist" aria-label="Modo de consulta del mapa">
                  {(['estado', 'sector'] as const).map((modo) => {
                    const activo = filtroPanel === modo
                    return (
                      <button
                        key={modo}
                        type="button"
                        role="tab"
                        aria-selected={activo}
                        className={`filtro-panel-tab${activo ? ' is-active' : ''}`}
                        onClick={() => {
                          setDireccionCarrusel(modo === 'sector' ? 1 : -1)
                          setFiltroPanel(modo)
                        }}
                      >
                        {modo === 'estado' ? 'Por estado' : 'Por sector'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Carrusel: anima CUALQUIER cambio de contenido del panel — alternar pestaña
                (tarjetas ↔ buscador) o elegir/cerrar un sector (↔ ficha de detalle) — con
                el deslizamiento de reactbits.dev/Carousel (ver CarruselSector). `vista`
                identifica qué se muestra; cambiarla es lo único que dispara la animación. */}
            <div className="hoja-sectores-cuerpo">
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
                ) : filtroPanel === 'estado' ? (
                  <TarjetasEstadoMapa
                    resumen={conteos}
                    estadoDestacado={estadoDestacado}
                    onAlternar={alAlternarEstadoDestacado}
                    temaActivo={temaActivo}
                    datosDisponibles={estadoDatos === 'success'}
                  />
                ) : (
                  <BuscadorBarrios
                    sectores={sectores}
                    busqueda={busqueda}
                    onCambiarBusqueda={setBusqueda}
                    cargando={cargando}
                    error={error}
                    onSectorSeleccionado={alSeleccionarSector}
                  />
                )}
              </CarruselSector>
            </div>
          </aside>
        </div>
      </GradientWaves>
      </section>

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando bitácora…</div>}>
        <SeccionBitacora
          busqueda={busquedaBitacora}
          boletines={boletines}
          estadoAcuacar={estadoAcuacar}
          onRecargarAcuacar={recargarAcuacar}
        />
      </Suspense>

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando estadísticas…</div>}>
        <SeccionEstadisticas />
      </Suspense>

      <LlamadoVeedor
        onSuscribirse={() => setSuscripcionAbierta(true)}
        onAbrirPanel={() => setLoginVeedorAbierto(true)}
        onReportar={() => setModalAbierto(true)}
      />

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando veeduría…</div>}>
        <SeccionVeedor
          loginAbierto={loginVeedorAbierto}
          onCerrarLogin={() => setLoginVeedorAbierto(false)}
        />
      </Suspense>

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
      />
    </main>
  )
}

export default PaginaMapa
