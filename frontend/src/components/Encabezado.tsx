/**
 * Encabezado principal de AguaVigía CTG.
 * Contiene el logotipo, la navegación principal y el selector de tema.
 * Accesible: nav con landmark role="navigation" y aria-label.
 */
import type { FC } from 'react'
import { NavLink } from 'react-router-dom'
import { SelectorTema } from './SelectorTema'
import type { useTheme } from '../hooks/useTheme'

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const ENLACES = [
  { a: '/',          etiqueta: 'Mapa' },
  { a: '/reportar',  etiqueta: 'Reportar' },
  { a: '/estadisticas', etiqueta: 'Estadísticas' },
  { a: '/bitacora',  etiqueta: 'Bitácora' },
  { a: '/veedor',    etiqueta: 'Veedor' },
]

const estiloNavLink = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? 'var(--color-acento)' : 'var(--color-tinta-2)',
  fontWeight: isActive ? '600' : '400',
  textDecoration: 'none',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radio-base)',
  fontSize: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  transition: 'color var(--transicion)',
})

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => (
  <header
    role="banner"
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--color-superficie)',
      borderBottom: '1px solid var(--color-linea)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1rem',
      minHeight: '60px',
      gap: '1rem',
    }}
  >
    {/* Logotipo */}
    <a
      href="/"
      id="logo-aguavigia"
      aria-label="AguaVigía CTG — inicio"
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.2rem',
        fontWeight: '700',
        color: 'var(--color-acento)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        minHeight: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}
    >
      💧 AguaVigía
    </a>

    {/* Navegación principal */}
    <nav aria-label="Navegación principal" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
      {ENLACES.map(({ a, etiqueta }) => (
        <NavLink key={a} to={a} end={a === '/'} style={estiloNavLink}>
          {etiqueta}
        </NavLink>
      ))}
    </nav>

    {/* Selector de tema */}
    <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
  </header>
)
