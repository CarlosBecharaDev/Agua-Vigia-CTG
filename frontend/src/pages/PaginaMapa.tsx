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
import { MapPin, Menu } from 'lucide-react'
import { MapaCartagena } from '../components/MapaCartagena'
import { BuscadorBarrios } from '../components/BuscadorBarrios'
import { CarruselSector } from '../components/CarruselSector/CarruselSector'
import { ModalReporte } from '../components/ModalReporte'
import { ModalSuscripcion } from '../components/ModalSuscripcion'
import { NavegacionFlotante } from '../components/NavegacionFlotante'
import { GooeyNav } from '../components/GooeyNav/GooeyNav'
import { PanelProyecto } from '../components/PanelProyecto'
import { GradientWaves } from '../components/GradientWaves/GradientWaves'
import { PieDePagina } from '../components/PieDePagina'
import { TarjetasEstadoMapa } from '../components/TarjetasEstadoMapa'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import type { useTheme } from '../hooks/useTheme'

// Cargados aparte del bundle de esta página, no antes de que haga falta: los tres arrastran
// `recharts` (SeccionEstadisticas y PanelDetalleSector, por su mini-gráfica de cumplimiento) o
// van bajo el pliegue (SeccionBitacora). RNF001 medía 715 KB en un solo chunk sin dividir.
const PanelDetalleSector = lazy(() => import('../components/PanelDetalleSector').then((m) => ({ default: m.PanelDetalleSector })))
const SeccionBitacora = lazy(() => import('../components/SeccionBitacora').then((m) => ({ default: m.SeccionBitacora })))
const SeccionEstadisticas = lazy(() => import('../components/SeccionEstadisticas').then((m) => ({ default: m.SeccionEstadisticas })))

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const PaginaMapa: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const { sectores, cargando, error, ultimaActualizacion, boletines } = useDatosEnVivo();

  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [suscripcionAbierta, setSuscripcionAbierta] = useState(false)
  const [sectorReporte, setSectorReporte] = useState<string>('')
  const [busqueda, setBusqueda] = useState<string>('')
  const [filtroPanel, setFiltroPanel] = useState<'estado' | 'sector'>('estado')
  const [panelColapsado, setPanelColapsado] = useState(false)
  const [busquedaBitacora, setBusquedaBitacora] = useState<string>('')
  const [seccionActiva, setSeccionActiva] = useState<'mapa' | 'bitacora' | 'estadisticas'>('mapa')
  const [estadoDestacado, setEstadoDestacado] = useState<EstadoServicio | null>(null)

  const conteos = [
    { estado: 'SIN_SERVICIO' as const, n: sectores.filter(s => s.estado === 'SIN_SERVICIO').length },
    { estado: 'PRESION_BAJA' as const, n: sectores.filter(s => s.estado === 'PRESION_BAJA').length },
    { estado: 'CORTE_PROGRAMADO' as const, n: sectores.filter(s => s.estado === 'CORTE_PROGRAMADO').length },
    { estado: 'CON_SERVICIO' as const, n: sectores.filter(s => s.estado === 'CON_SERVICIO').length },
  ]

  const alSeleccionarSector = useCallback((sector: Sector | null) => {
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
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [hash])

  // Sombrea el enlace del navbar según la sección visible al hacer scroll, no solo al
  // hacer click — "activa" es la sección cuyo borde superior ya cruzó la franja justo
  // debajo del navbar fijo (rootMargin negativo arriba). El corte al -55% abajo evita que
  // dos secciones cuenten como "visibles" a la vez mientras una reemplaza a la otra.
  useEffect(() => {
    const secciones: Array<{ id: string; seccion: 'mapa' | 'bitacora' | 'estadisticas' }> = [
      { id: 'mapa', seccion: 'mapa' },
      { id: 'bitacora', seccion: 'bitacora' },
      { id: 'estadisticas', seccion: 'estadisticas' },
    ]
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return
          const encontrada = secciones.find((s) => s.id === entrada.target.id)
          if (encontrada) setSeccionActiva(encontrada.seccion)
        })
      },
      { rootMargin: '-64px 0px -55% 0px', threshold: 0 }
    )
    secciones.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observador.observe(el)
    })
    return () => observador.disconnect()
  }, [])

  return (
    <main id="contenido-principal" tabIndex={-1} role="main" aria-label="Mapa en vivo del servicio de agua en Cartagena" className="pagina-principal">
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
      />

      {/* GradientWaves es el fondo del hero; el recuadro unificado (mapa + panel de sectores)
          va anidado DENTRO de su contenedor para que el pointermove del efecto siga
          llegando aunque el div de Leaflet lo cubra visualmente por completo — el evento
          burbujea hacia arriba. Mapa y panel comparten un solo marco: un borde, una sombra,
          unas esquinas — no dos piezas flotando por separado. */}
      <section id="mapa" className="mapa-vista-completa" aria-label="Mapa en vivo">
      <GradientWaves>
        <PanelProyecto onSuscribirse={() => setSuscripcionAbierta(true)} />

        <div className={`panel-mapa-unificado${panelColapsado ? ' panel-mapa-unificado--colapsado' : ''}`}>
          <div className="mapa-lienzo-completo">
            <MapaCartagena
              sectores={sectores}
              cargando={cargando}
              ultimaActualizacion={ultimaActualizacion}
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
              <h2 className="mapa-titulo">¿Cómo está el agua en tu barrio?</h2>
              <p className="mapa-subtitulo">
                Sé un <strong>AguaVigía</strong>: reporta y ayuda a que esto se resuelva más rápido.
              </p>

              {/* Puramente decorativo — ya no es el estado "vacío" de PanelDetalleSector (ese
                  branch se eliminó). No reacciona a nada: mismo texto de siempre, reubicado
                  aquí arriba de las pestañas como una pista fija de cómo usar el panel. */}
              <p className="hoja-sectores-pista">
                <MapPin size={13} aria-hidden="true" />
                Selecciona un sector para ver su información
              </p>

              {/* Mismo componente y efecto líquido del navbar (GooeyNav): la píldora activa
                  se sombrea de blanco, igual que "Mapa en vivo" arriba. Los href son
                  anclas ficticias — GooeyNav siempre hace preventDefault, así que acá
                  solo sirven de key/aria, el cambio real de vista lo hace onSelect. */}
              <div className="filtro-panel-tabs">
                <GooeyNav
                  items={[
                    { href: '#por-estado', label: 'Por estado' },
                    { href: '#por-sector', label: 'Por sector' },
                  ]}
                  activeIndex={filtroPanel === 'estado' ? 0 : 1}
                  onSelect={(indice) => setFiltroPanel(indice === 0 ? 'estado' : 'sector')}
                />
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
              >
                {sectorActivo ? (
                  <Suspense fallback={null}>
                    <PanelDetalleSector
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
        <SeccionBitacora busqueda={busquedaBitacora} />
      </Suspense>

      <Suspense fallback={<div className="seccion-cargando" role="status">Cargando estadísticas…</div>}>
        <SeccionEstadisticas />
      </Suspense>

      <PieDePagina />

      <ModalReporte
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        sectores={sectores}
        sectorPreseleccionado={sectorReporte}
      />

      <ModalSuscripcion
        abierto={suscripcionAbierta}
        onCerrar={() => setSuscripcionAbierta(false)}
      />
    </main>
  )
}

export default PaginaMapa
