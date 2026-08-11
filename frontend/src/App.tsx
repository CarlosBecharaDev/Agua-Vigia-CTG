/**
 * App — raíz de la SPA de AguaVigía CTG.
 *
 * Ensambla: router, encabezado con selector de tema, rutas y layout.
 * El tema se inicializa aquí y se propaga al DOM vía data-theme en :root
 * (ver useTheme y DESIGN.md §3).
 */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Encabezado } from './components/Encabezado'
import { useTheme } from './hooks/useTheme'
import PaginaMapa from './pages/PaginaMapa'
import PaginaReportar from './pages/PaginaReportar'
import PaginaVeedor from './pages/PaginaVeedor'
import { SplashScreen } from './components/SplashScreen'

// Al recargar la página el navegador restaura por su cuenta la posición de scroll que
// tenía antes del reload (aunque la URL sea la misma "/"), así que un reload en la sección
// Estadísticas "aterriza" ahí en vez de en el inicio. Desactivarlo aquí, antes de que React
// monte nada, deja el control del scroll enteramente al efecto de hash en PaginaMapa.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

/**
 * ContenidoApp — vive dentro de BrowserRouter (useLocation lo exige) y decide el shell.
 *
 * "/" (la página principal) usa su propio chrome flotante (ver PaginaMapa +
 * NavegacionFlotante) a pantalla completa, sin el sidebar/topbar de Encabezado. El resto
 * de rutas conserva el shell de siempre, sin cambios.
 */
function ContenidoApp() {
  const { temaActivo, alternarTema } = useTheme()
  const { pathname } = useLocation()
  const esPaginaPrincipal = pathname === '/'

  if (esPaginaPrincipal) {
    return <PaginaMapa temaActivo={temaActivo} onAlternarTema={alternarTema} />
  }

  return (
    <>
      <Encabezado temaActivo={temaActivo} onAlternarTema={alternarTema} />
      <div className="app-main">
        <Routes>
          <Route path="/reportar"      element={<PaginaReportar />} />
          <Route path="/veedor"        element={<PaginaVeedor />} />
        </Routes>
      </div>
    </>
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
