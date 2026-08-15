/**
 * NavegacionFlotante — navbar superior de la página principal (M1), alternativa "mapa
 * completo". Reemplaza el sidebar+topbar de Encabezado SOLO en "/": una barra horizontal
 * fija arriba, flotando sobre el mapa a pantalla completa. Las demás páginas siguen usando
 * Encabezado sin cambios.
 */
import type { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Megaphone } from 'lucide-react'
import { SelectorTema } from './SelectorTema'
import { ENLACES } from '../config/navegacion'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>
type SeccionPrincipal = 'mapa' | 'bitacora' | 'estadisticas'

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
  seccionActiva: SeccionPrincipal
  busquedaBitacora: string
  onCambiarBusquedaBitacora: (valor: string) => void
  onReportar: () => void
}

const DESTINO_POR_SECCION: Record<SeccionPrincipal, string> = {
  mapa: '/',
  bitacora: '/#bitacora',
  estadisticas: '/#estadisticas',
}

export const NavegacionFlotante: FC<Props> = ({
  temaActivo,
  onAlternarTema,
  seccionActiva,
  busquedaBitacora,
  onCambiarBusquedaBitacora,
  onReportar,
}) => {
  const navigate = useNavigate()

  // NavLink solo compara pathname: "/", "/#estadisticas" y "/#bitacora" resuelven todos a
  // pathname "/", así que su isActive automático los marcaría activos a los tres a la vez.
  // En su lugar sombreamos según qué sección está visible en pantalla (seccionActiva, que
  // PaginaMapa deriva con un IntersectionObserver) — así el navbar reacciona igual al
  // hacer click que al hacer scroll manualmente hasta una sección.
  const indiceActivo = Math.max(
    0,
    ENLACES.findIndex(({ a }) => DESTINO_POR_SECCION[seccionActiva] === a)
  )

  return (
  <header className="navbar-superior" role="banner">
    {/* El nombre en versalitas espaciadas, como el título impreso al margen de una carta.
        Antes era una píldora con sombra flotando sobre el mapa. */}
    <Link to="/" id="logo-aguavigia" className="navbar-marca" aria-label="AguaVigía CTG — inicio">
      <span className="navbar-marca-copy">AguaVigía</span>
      <span className="navbar-marca-lugar">Cartagena</span>
    </Link>

    {/* Enlaces como rótulos de carta: el activo se marca con un filete debajo, no con una
        píldora blanca. Sustituye al GooeyNav, que traía un efecto líquido de burbujas con
        su propia paleta —ajena a la del producto— para señalar cuál de cuatro secciones
        estaba abierta. */}
    <nav className="navbar-enlaces" aria-label="Secciones">
      {ENLACES.map(({ a, etiqueta }, indice) => (
        <button
          key={a}
          type="button"
          className={`navbar-enlace${indice === indiceActivo ? ' is-activo' : ''}`}
          aria-current={indice === indiceActivo ? 'page' : undefined}
          onClick={() => navigate(a)}
        >
          {etiqueta}
        </button>
      ))}
    </nav>

    <div className="navbar-acciones">
      <div className="navbar-buscador-bitacora">
        <Search size={15} aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar en la bitácora"
          aria-label="Buscar en la bitácora"
          value={busquedaBitacora}
          onChange={(e) => onCambiarBusquedaBitacora(e.target.value)}
          onFocus={() => document.getElementById('bitacora')?.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />

      {/* La única acción con relleno de toda la barra: es lo que el producto le pide a la
          gente que haga. La magenta de aviso náutico la reserva para sí. */}
      <button type="button" onClick={onReportar} className="navbar-reportar">
        <Megaphone size={15} aria-hidden="true" />
        <span>Reportar</span>
      </button>
    </div>
  </header>
  )
}
