/**
 * NavegacionFlotante — navbar superior de la página principal (M1), alternativa "mapa
 * completo". Reemplaza el sidebar+topbar de Encabezado SOLO en "/": una barra horizontal
 * fija arriba, flotando sobre el mapa a pantalla completa. Las demás páginas siguen usando
 * Encabezado sin cambios.
 *
 * En teléfono la barra de arriba se queda con la marca, el tema y "Reportar ahora", y los
 * enlaces de sección se mudan a NavegacionInferior: el riel de GooeyNav necesita ancho para
 * las cuatro etiquetas y por debajo de 768px no lo hay.
 */
import { useCallback } from 'react'
import type { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Megaphone } from 'lucide-react'
import { SelectorTema } from './SelectorTema'
import { GooeyNav } from './GooeyNav/GooeyNav'
import { NavegacionInferior } from './NavegacionInferior/NavegacionInferior'
import { ENLACES } from '../config/navegacion'
import { useConsultaMedios } from '../hooks/useConsultaMedios'
import { desplazarAlMapa } from '../utils/desplazarAlMapa'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>
type SeccionPrincipal = 'mapa' | 'bitacora' | 'estadisticas' | 'veedor'

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
  veedor: '/#veedor',
}

// El mismo corte que usan las reglas móviles de `.navbar-superior` en index.css. Se decide
// en JS y no solo con CSS para no dejar en el DOM dos navegaciones a la vez: un lector de
// pantalla anunciaría los mismos cuatro destinos dos veces.
const CORTE_MOVIL = '(max-width: 768px)'

export const NavegacionFlotante: FC<Props> = ({
  temaActivo,
  onAlternarTema,
  seccionActiva,
  busquedaBitacora,
  onCambiarBusquedaBitacora,
  onReportar,
}) => {
  const navigate = useNavigate()
  const esMovil = useConsultaMedios(CORTE_MOVIL)

  // NavLink solo compara pathname: "/", "/#estadisticas" y "/#bitacora" resuelven todos a
  // pathname "/", así que su isActive automático los marcaría activos a los tres a la vez.
  // En su lugar sombreamos según qué sección está visible en pantalla (seccionActiva, que
  // PaginaMapa deriva con un IntersectionObserver) — así el navbar reacciona igual al
  // hacer click que al hacer scroll manualmente hasta una sección.
  const indiceActivo = Math.max(
    0,
    ENLACES.findIndex(({ a }) => DESTINO_POR_SECCION[seccionActiva] === a)
  )

  const irA = useCallback(
    (_indice: number, href: string) => {
      if (href === '/') {
        desplazarAlMapa()
        if (window.location.hash) {
          window.history.pushState(null, '', '/')
        }
      } else if (href.startsWith('/#')) {
        const id = href.slice(2)
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          window.history.pushState(null, '', href)
        } else {
          navigate(href)
        }
      } else {
        navigate(href)
      }
    },
    [navigate]
  )

  return (
  <>
  <header className="navbar-superior" role="banner">
    <Link to="/" id="logo-aguavigia" className="navbar-marca" aria-label="AguaVigía CTG — inicio">
      <span className="navbar-marca-copy">AguaVigía</span>
    </Link>

    <div className="navbar-buscador-bitacora">
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        placeholder="Buscar en la bitácora..."
        aria-label="Buscar en la bitácora"
        value={busquedaBitacora}
        onChange={(e) => onCambiarBusquedaBitacora(e.target.value)}
        onFocus={() => document.getElementById('bitacora')?.scrollIntoView({ behavior: 'smooth' })}
      />
    </div>

    {!esMovil && (
      <div className="navbar-enlaces">
        <GooeyNav
          items={ENLACES.map(({ a, etiqueta }) => ({ href: a, label: etiqueta }))}
          activeIndex={indiceActivo}
          onSelect={irA}
        />
      </div>
    )}

    <div className="navbar-acciones">
      <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
      <button type="button" onClick={onReportar} className="navbar-reportar hover-glowing">
        <Megaphone size={15} aria-hidden="true" />
        <span>Reportar ahora</span>
      </button>
    </div>
  </header>

  {esMovil && <NavegacionInferior items={ENLACES} activeIndex={indiceActivo} onSelect={irA} />}
  </>
  )
}
