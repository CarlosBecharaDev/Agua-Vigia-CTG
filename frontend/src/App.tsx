/**
 * App — raíz de la SPA de AguaVigía CTG.
 *
 * Ensambla: router, encabezado con selector de tema, rutas y layout.
 * El tema se inicializa aquí y se propaga al DOM vía data-theme en :root
 * (ver useTheme y DESIGN.md §3).
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Encabezado } from './components/Encabezado'
import { useTheme } from './hooks/useTheme'
import { SplashScreen } from './components/SplashScreen'

import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

// Cada vista carga solo cuando se visita. Esto mantiene pequena la primera carga
// de la SPA, especialmente en conexiones moviles u offline.
const PaginaMapa = lazy(() => import('./pages/PaginaMapa'))
const PaginaReportar = lazy(() => import('./pages/PaginaReportar'))
const PaginaEstadisticas = lazy(() => import('./pages/PaginaEstadisticas'))
const PaginaBitacora = lazy(() => import('./pages/PaginaBitacora'))
const PaginaVeedor = lazy(() => import('./pages/PaginaVeedor'))

function FallbackDeRuta() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight: '40vh', display: 'grid', placeItems: 'center', padding: '2rem', color: 'var(--color-tinta-2)' }}
    >
      Cargando vista...
    </div>
  )
}

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

/**
 * Una ruta lazy puede fallar si su fragmento todavia no esta en cache y el
 * dispositivo pierde la conexion durante la navegacion. Evita dejar la SPA
 * en blanco y ofrece una recuperacion explicita.
 */
class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo cargar la vista solicitada:', error, info)
  }

  reintentar = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          id="contenido-principal"
          role="alert"
          style={{ minHeight: '40vh', display: 'grid', placeItems: 'center', padding: '2rem' }}
        >
          <div style={{ maxWidth: '30rem', textAlign: 'center', color: 'var(--color-tinta-2)' }}>
            <h1 style={{ color: 'var(--color-tinta)', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              No pudimos cargar esta vista
            </h1>
            <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>
              Comprueba tu conexión e inténtalo de nuevo. Si estás sin conexión,
              vuelve a una sección que ya hayas visitado.
            </p>
            <button
              type="button"
              onClick={this.reintentar}
              style={{
                border: 'none',
                borderRadius: 'var(--radio-pill)',
                padding: '0.65rem 1rem',
                background: 'var(--color-acento)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Recargar vista
            </button>
            <a
              href="/"
              style={{ display: 'block', marginTop: '0.75rem', color: 'var(--color-acento)', fontSize: '0.875rem' }}
            >
              Volver al inicio
            </a>
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
      <Suspense fallback={<FallbackDeRuta />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"              element={<PaginaMapa />} />
            <Route path="/reportar"      element={<PaginaReportar />} />
            <Route path="/estadisticas"  element={<PaginaEstadisticas />} />
            <Route path="/bitacora"      element={<PaginaBitacora />} />
            <Route path="/veedor"        element={<PaginaVeedor />} />
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

      <Encabezado temaActivo={temaActivo} onAlternarTema={alternarTema} />

      <RutasAnimadas />
    </BrowserRouter>
  )
}

export default App
