/**
 * App — raíz de la SPA de AguaVigía CTG.
 *
 * Ensambla: router, encabezado con selector de tema, rutas y layout.
 * El tema se inicializa aquí y se propaga al DOM vía data-theme en :root
 * (ver useTheme y DESIGN.md §3).
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Component, lazy, Suspense, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Encabezado } from './components/Encabezado'
import { useTheme } from './hooks/useTheme'
import { ModalSuscripcion } from './components/ModalSuscripcion'
import { SplashScreen } from './components/SplashScreen'

// Cada vista carga solo cuando se visita, especialmente útil en conexiones móviles.
const PaginaMapa = lazy(() => import('./pages/PaginaMapa'))
const PaginaReportar = lazy(() => import('./pages/PaginaReportar'))
const PaginaConfirmarReporte = lazy(() => import('./pages/PaginaConfirmarReporte'))
const PaginaSector = lazy(() => import('./pages/PaginaSector'))
const PaginaVeedor = lazy(() => import('./pages/PaginaVeedor'))
const PaginaNoEncontrada = lazy(() => import('./pages/PaginaNoEncontrada'))

// Al recargar la página el navegador restaura por su cuenta la posición de scroll que
// tenía antes del reload (aunque la URL sea la misma "/"), así que un reload en la sección
// Estadísticas "aterriza" ahí en vez de en el inicio. Desactivarlo aquí, antes de que React
// monte nada, deja el control del scroll enteramente al efecto de hash en PaginaMapa.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

interface RouteErrorBoundaryProps { children: ReactNode }
interface RouteErrorBoundaryState { hasError: boolean }

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo cargar la vista solicitada:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main id="contenido-principal" role="alert" className="cargando-pagina">
          <div style={{ maxWidth: '30rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>No pudimos cargar esta vista</h1>
            <p style={{ marginBottom: '1rem' }}>Comprueba tu conexión e inténtalo nuevamente.</p>
            <button type="button" className="boton boton-primario" onClick={() => window.location.reload()}>
              Recargar vista
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

/**
 * ContenidoApp — vive dentro de BrowserRouter (useLocation lo exige) y decide el shell.
 *
 * "/" (la página principal) usa su propio chrome flotante (ver PaginaMapa +
 * NavegacionFlotante) a pantalla completa, sin el sidebar/topbar de Encabezado, y maneja su
 * propio ModalSuscripcion (ver PanelProyecto ahí). El resto de rutas conserva el shell de
 * siempre, con su propia instancia del modal para el botón "Suscribirme" del Encabezado —
 * montar las dos instancias a la vez en "/" duplicaría la conexión SSE de useDatosEnVivo.
 */
function ContenidoApp() {
  const { temaActivo, alternarTema } = useTheme()
  const { pathname } = useLocation()
  const esPaginaPrincipal = pathname === '/'
  const [suscripcionAbierta, setSuscripcionAbierta] = useState(false)

  return (
    <RouteErrorBoundary key={pathname}>
      <Suspense fallback={<div className="cargando-pagina" role="status"><span /> Cargando experiencia…</div>}>
        {esPaginaPrincipal ? (
          <PaginaMapa temaActivo={temaActivo} onAlternarTema={alternarTema} />
        ) : (
          <>
            <Encabezado temaActivo={temaActivo} onAlternarTema={alternarTema} onAbrirSuscripcion={() => setSuscripcionAbierta(true)} />
            <div className="app-main">
              <Routes>
                <Route path="/reportar" element={<PaginaReportar />} />
                <Route path="/confirmar/:id" element={<PaginaConfirmarReporte />} />
                <Route path="/sectores/:id" element={<PaginaSector />} />
                <Route path="/veedor" element={<PaginaVeedor />} />
                <Route path="*" element={<PaginaNoEncontrada />} />
              </Routes>
            </div>
            <ModalSuscripcion abierto={suscripcionAbierta} onCerrar={() => setSuscripcionAbierta(false)} />
          </>
        )}
      </Suspense>
    </RouteErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SplashScreen />
      <a
        href="#contenido-principal"
        id="saltar-al-contenido"
        style={{
          position: 'absolute',
          top: '-999px',
          left: '-999px',
          zIndex: 9999,
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-acento)',
          color: '#fff',
          borderRadius: 'var(--radio-base)',
          fontFamily: 'var(--font-cuerpo)',
          textDecoration: 'none',
        }}
        onFocus={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.top = '0.5rem'
          el.style.left = '0.5rem'
        }}
        onBlur={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.top = '-999px'
          el.style.left = '-999px'
        }}
      >
        Ir al contenido principal
      </a>

      <div className="app-shell">
        <ContenidoApp />
      </div>
    </BrowserRouter>
  )
}

export default App
