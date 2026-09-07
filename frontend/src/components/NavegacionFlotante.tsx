/**
 * NavegacionFlotante — navbar superior de la página principal (M1), alternativa "mapa
 * completo". Reemplaza el sidebar+topbar de Encabezado SOLO en "/": una barra horizontal
 * fija arriba, flotando sobre el mapa a pantalla completa. Las demás páginas siguen usando
 * Encabezado sin cambios.
 *
 * En teléfono la barra de arriba se queda con la marca, el tema y "Reportar ahora", y los
 * enlaces de sección se mudan a NavegacionInferior para conservar blancos táctiles cómodos.
 */
import { useCallback } from 'react'
import type { FC } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Droplets } from 'lucide-react'
import { SelectorTema } from './SelectorTema'
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
  onReportar,
}) => {
  const navigate = useNavigate()
  const esMovil = useConsultaMedios(CORTE_MOVIL)

  const indiceActivo = Math.max(
    0,
    ENLACES.findIndex(({ a }) => DESTINO_POR_SECCION[seccionActiva] === a)
  )

  const irA = useCallback(
    (_indice: number, href: string) => {
      if (href === '/') {
        desplazarAlMapa()
        if (window.location.hash) {
          navigate('/')
        }
      } else if (href.startsWith('/#')) {
        const id = href.slice(2)
        const el = document.getElementById(id)
        if (el) {
          navigate(href)
          requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
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
      <div className="navbar-marca-senal" aria-hidden="true">
        <Droplets size={18} />
      </div>
      <div className="navbar-marca-texto">
        <span className="navbar-marca-copy">AguaVigía</span>
        <span className="navbar-marca-ctg">CTG</span>
        <small className="navbar-marca-subtitulo sr-only">Cartagena</small>
      </div>
    </Link>

    {!esMovil && (
      <nav className="navbar-enlaces" aria-label="Secciones de la página principal">
        {ENLACES.map(({ a, etiqueta }, indice) => {
          const esActivo = indice === indiceActivo
          return (
            <button
              type="button"
              key={a}
              className={esActivo ? 'activo' : ''}
              aria-current={esActivo ? 'page' : undefined}
              aria-label={etiqueta}
              onClick={() => irA(indice, a)}
            >
              {etiqueta === 'Mapa en vivo' && (
                <span className="navbar-enlace-punto" aria-hidden="true" />
              )}
              <span>{etiqueta}</span>
            </button>
          )
        })}
      </nav>
    )}

    <div className="navbar-acciones">
      <button type="button" onClick={onReportar} className="navbar-reportar">
        <Megaphone size={15} aria-hidden="true" />
        <span>Reportar ahora</span>
      </button>
      <div className="navbar-separador" aria-hidden="true" />
      <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
    </div>
  </header>

  {esMovil && <NavegacionInferior items={ENLACES} activeIndex={indiceActivo} onSelect={irA} />}
  </>
  )
}
