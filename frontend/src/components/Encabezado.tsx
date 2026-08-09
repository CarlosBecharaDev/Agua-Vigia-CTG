import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, BookOpenText, Droplet, Map, Menu, Megaphone, ShieldCheck, Waves, X } from 'lucide-react'
import { SelectorTema } from './SelectorTema'
import { BotonInstalarPWA } from './BotonInstalarPWA'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const ENLACES = [
  { a: '/', etiqueta: 'Mapa en vivo', resumen: 'Estado por barrio', Icono: Map },
  { a: '/estadisticas', etiqueta: 'Estadísticas', resumen: 'Indicadores públicos', Icono: BarChart3 },
  { a: '/bitacora', etiqueta: 'Bitácora', resumen: 'Historial verificable', Icono: BookOpenText },
  { a: '/veedor', etiqueta: 'Panel veedor', resumen: 'Gestión operativa', Icono: ShieldCheck },
]

const CONTEXTO: Record<string, { seccion: string; titulo: string }> = {
  '/': { seccion: 'Monitoreo', titulo: 'Mapa en vivo' },
  '/reportar': { seccion: 'Participación', titulo: 'Reporte ciudadano' },
  '/estadisticas': { seccion: 'Análisis', titulo: 'Estadísticas' },
  '/bitacora': { seccion: 'Transparencia', titulo: 'Bitácora pública' },
  '/veedor': { seccion: 'Operación', titulo: 'Panel del veedor' },
}

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const contexto = CONTEXTO[pathname] ?? { seccion: 'AguaVigía', titulo: 'Plataforma ciudadana' }

  useEffect(() => setMenuAbierto(false), [pathname])

  useEffect(() => {
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [])

  return (
    <>
      <aside className={`app-sidebar${menuAbierto ? ' abierto' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-marca">
          <Link to="/" aria-label="AguaVigía CTG — inicio">
            <span className="sidebar-logo" aria-hidden="true"><Droplet size={22} strokeWidth={2.5} /></span>
            <span><strong>AguaVigía</strong><small>Cartagena</small></span>
          </Link>
          <button type="button" className="sidebar-cerrar" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)}><X size={20} /></button>
        </div>

        <div className="sidebar-espacio">
          <span aria-hidden="true"><Waves size={18} /></span>
          <div><small>Espacio de trabajo</small><strong>Servicio de agua</strong></div>
        </div>

        <nav className="sidebar-nav" aria-label="Secciones">
          <span className="sidebar-etiqueta">Navegación</span>
          {ENLACES.map(({ a, etiqueta, resumen, Icono }) => (
            <NavLink key={a} to={a} end={a === '/'} className={({ isActive }) => `sidebar-enlace${isActive ? ' activo' : ''}`}>
              <span className="sidebar-enlace-icono" aria-hidden="true"><Icono size={19} /></span>
              <span><strong>{etiqueta}</strong><small>{resumen}</small></span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-accion">
          <p>¿Cambió el servicio en tu barrio?</p>
          <Link to="/reportar" className="boton boton-primario boton-ancho"><Megaphone size={17} /> Reportar ahora</Link>
        </div>

        <footer className="sidebar-pie">
          <span className="live-dot" aria-hidden="true" />
          <div><strong>Sistema operativo</strong><small>Datos oficiales y ciudadanos</small></div>
        </footer>
      </aside>

      <button
        type="button"
        className={`sidebar-fondo${menuAbierto ? ' visible' : ''}`}
        aria-label="Cerrar menú"
        tabIndex={menuAbierto ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />

      <header className="app-topbar" role="banner">
        <div className="topbar-titulo">
          <button type="button" className="menu-abrir" aria-label="Abrir menú" aria-expanded={menuAbierto} onClick={() => setMenuAbierto(true)}><Menu size={21} /></button>
          <div><small>{contexto.seccion}</small><strong>{contexto.titulo}</strong></div>
        </div>
        <div className="topbar-acciones">
          <BotonInstalarPWA />
          <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
          <Link to="/reportar" className="boton boton-reporte-topbar"><Megaphone size={17} /><span>Reportar estado</span></Link>
        </div>
      </header>
    </>
  )
}
