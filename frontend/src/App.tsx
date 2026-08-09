/**
 * App — raíz de la SPA de AguaVigía CTG.
 *
 * Ensambla: router, encabezado con selector de tema, rutas y layout.
 * El tema se inicializa aquí y se propaga al DOM vía data-theme en :root.
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Encabezado } from './components/Encabezado'
import { useTheme } from './hooks/useTheme'

// Cada vista carga solo cuando se visita, especialmente útil en conexiones móviles.
const PaginaMapa = lazy(() => import('./pages/PaginaMapa'))
const PaginaReportar = lazy(() => import('./pages/PaginaReportar'))
const PaginaEstadisticas = lazy(() => import('./pages/PaginaEstadisticas'))
const PaginaBitacora = lazy(() => import('./pages/PaginaBitacora'))
const PaginaVeedor = lazy(() => import('./pages/PaginaVeedor'))

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

function RutasAnimadas() {
  const location = useLocation()
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<div className="cargando-pagina" role="status"><span /> Cargando experiencia…</div>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PaginaMapa />} />
            <Route path="/reportar" element={<PaginaReportar />} />
            <Route path="/estadisticas" element={<PaginaEstadisticas />} />
            <Route path="/bitacora" element={<PaginaBitacora />} />
            <Route path="/veedor" element={<PaginaVeedor />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </RouteErrorBoundary>
  )
}

function App() {
  const { temaActivo, alternarTema } = useTheme()

  return (
    <BrowserRouter>
      <a href="#contenido-principal" id="saltar-al-contenido">Ir al contenido principal</a>
      <Encabezado temaActivo={temaActivo} onAlternarTema={alternarTema} />
      <RutasAnimadas />
    </BrowserRouter>
  )
}

export default App
