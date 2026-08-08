/**
 * App — raíz de la SPA de AguaVigía CTG.
 *
 * Ensambla: router, encabezado con selector de tema, rutas y layout.
 * El tema se inicializa aquí y se propaga al DOM vía data-theme en :root
 * (ver useTheme y DESIGN.md §3).
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Encabezado } from './components/Encabezado'
import { useTheme } from './hooks/useTheme'
import PaginaMapa from './pages/PaginaMapa'
import PaginaReportar from './pages/PaginaReportar'
import PaginaEstadisticas from './pages/PaginaEstadisticas'
import PaginaBitacora from './pages/PaginaBitacora'
import PaginaVeedor from './pages/PaginaVeedor'
import { SplashScreen } from './components/SplashScreen'

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

      <Routes>
        <Route path="/"              element={<PaginaMapa />} />
        <Route path="/reportar"      element={<PaginaReportar />} />
        <Route path="/estadisticas"  element={<PaginaEstadisticas />} />
        <Route path="/bitacora"      element={<PaginaBitacora />} />
        <Route path="/veedor"        element={<PaginaVeedor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
