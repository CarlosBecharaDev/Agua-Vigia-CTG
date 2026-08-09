import type { FC } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BarChart3, BookOpenText, Droplets, Map, Megaphone, ShieldCheck } from 'lucide-react'
import { SelectorTema } from './SelectorTema'
import { BotonInstalarPWA } from './BotonInstalarPWA'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const ENLACES = [
  { a: '/', etiqueta: 'Mapa', Icono: Map },
  { a: '/estadisticas', etiqueta: 'Datos', Icono: BarChart3 },
  { a: '/bitacora', etiqueta: 'Bitácora', Icono: BookOpenText },
  { a: '/veedor', etiqueta: 'Veedor', Icono: ShieldCheck },
]

const Navegacion: FC<{ movil?: boolean }> = ({ movil = false }) => (
  <nav
    className={movil ? 'nav-movil' : 'nav-principal'}
    aria-label={movil ? 'Navegación móvil' : 'Navegación principal'}
  >
    {ENLACES.map(({ a, etiqueta, Icono }) => (
      <NavLink
        key={a}
        to={a}
        end={a === '/'}
        className={({ isActive }) => `nav-enlace${isActive ? ' activo' : ''}`}
      >
        <Icono size={18} aria-hidden="true" />
        <span>{etiqueta}</span>
      </NavLink>
    ))}
    {movil && (
      <NavLink
        to="/reportar"
        className={({ isActive }) => `nav-enlace nav-reportar${isActive ? ' activo' : ''}`}
      >
        <Megaphone size={18} aria-hidden="true" />
        <span>Reportar</span>
      </NavLink>
    )}
  </nav>
)

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => (
  <>
    <header role="banner" className="app-header">
      <div className="header-contenido">
        <Link to="/" id="logo-aguavigia" className="marca" aria-label="AguaVigía CTG — inicio">
          <span className="marca-icono" aria-hidden="true">
            <Droplets size={23} strokeWidth={2.4} />
          </span>
          <span className="marca-texto">
            <strong>AguaVigía</strong>
            <small>Cartagena</small>
          </span>
        </Link>

        <Navegacion />

        <div className="header-acciones">
          <BotonInstalarPWA />
          <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
          <Link to="/reportar" className="boton boton-reporte-header">
            <Megaphone size={17} aria-hidden="true" />
            Reportar estado
          </Link>
        </div>
      </div>
    </header>
    <Navegacion movil />
  </>
)
