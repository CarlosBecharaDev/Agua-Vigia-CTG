import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Clock3,
  Droplet,
  Mail,
  Map,
  Menu,
  ShieldCheck,
  Waves,
  X,
} from 'lucide-react'
import { SelectorTema } from './SelectorTema'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const ENLACES = [
  { a: '/', etiqueta: 'Mapa en vivo', resumen: 'Estado por barrio', Icono: Map },
  { a: '/estadisticas', etiqueta: 'Estadísticas', resumen: 'Tendencias y métricas', Icono: BarChart3 },
  { a: '/bitacora', etiqueta: 'Bitácora', resumen: 'Historial público', Icono: Clock3 },
  { a: '/veedor', etiqueta: 'Panel veedor', resumen: 'Validación ciudadana', Icono: ShieldCheck },
]

const TITULOS: Record<string, { seccion: string; titulo: string }> = {
  '/': { seccion: 'Monitoreo', titulo: 'Mapa en vivo' },
  '/reportar': { seccion: 'Participación', titulo: 'Reportar novedad' },
  '/estadisticas': { seccion: 'Análisis', titulo: 'Estadísticas' },
  '/bitacora': { seccion: 'Transparencia', titulo: 'Bitácora pública' },
  '/veedor': { seccion: 'Operación', titulo: 'Panel veedor' },
}

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const { pathname } = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const contexto = TITULOS[pathname] ?? { seccion: 'AguaVigía', titulo: 'Página' }

  useEffect(() => {
    setMenuAbierto(false)
  }, [pathname])

  useEffect(() => {
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAbierto(false)
    }
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [])

  return (
    <>
      <aside className={`app-sidebar${menuAbierto ? ' is-open' : ''}`} aria-label="Navegación principal">
        <div className="sidebar-brand">
          <Link to="/" id="logo-aguavigia" aria-label="AguaVigía CTG — inicio">
            <span className="brand-mark" aria-hidden="true"><Droplet size={23} strokeWidth={2.4} /></span>
            <span className="brand-copy">
              <strong>AguaVigía</strong>
              <small>Cartagena</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-context">
          <span className="context-icon" aria-hidden="true"><Waves size={18} /></span>
          <span><small>Espacio de trabajo</small><strong>Servicio de agua</strong></span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-label">Navegación</span>
          {ENLACES.map(({ a, etiqueta, resumen, Icono }) => (
            <NavLink
              key={a}
              to={a}
              end={a === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <span className="sidebar-link-icon" aria-hidden="true"><Icono size={19} /></span>
              <span className="sidebar-link-copy"><strong>{etiqueta}</strong><small>{resumen}</small></span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-mark" aria-hidden="true"><Droplet size={16} /></span>
          <span><strong>Monitoreo ciudadano</strong><small>Cartagena de Indias</small></span>
        </div>
      </aside>

      <button
        type="button"
        className={`sidebar-backdrop${menuAbierto ? ' is-visible' : ''}`}
        aria-label="Cerrar menú"
        tabIndex={menuAbierto ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />

      <header className="app-topbar" role="banner">
        <div className="topbar-heading">
          <button
            type="button"
            className="menu-trigger"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar-title">
            <span>{contexto.seccion}</span>
            <strong>{contexto.titulo}</strong>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="topbar-subscribe"
            onClick={() => window.open('mailto:alertas@aguavigia.com?subject=Suscripción a Alertas', '_blank')}
          >
            <Mail size={17} />
            <span>Suscribirme</span>
          </button>
          <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
        </div>
      </header>
    </>
  )
}
