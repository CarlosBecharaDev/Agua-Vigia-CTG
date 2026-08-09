/**
 * Encabezado principal de AguaVigía CTG.
 * Contiene el logotipo, la navegación principal y el selector de tema.
 * Diseño puro Premium Glassmorphism sin efectos líquidos.
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { SelectorTema } from './SelectorTema'
import { BotonInstalarPWA } from './BotonInstalarPWA'
import type { useTheme } from '../hooks/useTheme'
import { Map, BarChart3, Clock, Droplet, ShieldCheck } from 'lucide-react'

type ThemeProps = ReturnType<typeof useTheme>

interface Props {
  temaActivo: ThemeProps['temaActivo']
  onAlternarTema: ThemeProps['alternarTema']
}

const ENLACES = [
  { a: '/',          etiqueta: 'Mapa',         Icono: Map },
  { a: '/estadisticas', etiqueta: 'Estadísticas', Icono: BarChart3 },
  { a: '/bitacora',  etiqueta: 'Bitácora',     Icono: Clock },
  { a: '/veedor',    etiqueta: 'Veedor',       Icono: ShieldCheck },
]

const estiloNavLink = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  color: isActive ? 'var(--color-acento)' : 'var(--color-tinta-2)',
  fontWeight: isActive ? '600' : '500',
  textDecoration: 'none',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radio-base)',
  fontSize: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  transition: 'color var(--transicion), transform 0.2s ease, box-shadow 0.2s ease',
})

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  return (
    <header
      role="banner"
      className="panel-glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2000,
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
      <Link
        to="/"
        id="logo-aguavigia"
        aria-label="AguaVigía CTG — inicio"
        className="hover-glowing"
        style={{
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          minHeight: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0 0.5rem',
          borderRadius: 'var(--radio-md)',
        }}
      >
        <Droplet size={26} strokeWidth={2.5} color="var(--color-acento-vivo)" />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          fontWeight: '800',
          background: 'linear-gradient(90deg, var(--color-acento) 0%, var(--color-acento-vivo) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px'
        }}>
          AguaVigía
        </span>
      </Link>

      {/* Navegación principal */}
      <nav aria-label="Navegación principal" style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {ENLACES.map(({ a, etiqueta, Icono }) => (
          <NavLink key={a} to={a} end={a === '/'} className="hover-glowing" style={estiloNavLink}>
            <Icono size={18} style={{ marginRight: '6px' }} />
            {etiqueta}
          </NavLink>
        ))}
      </nav>

      {/* Zona de Reloj y Selector de Tema */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <BotonInstalarPWA />
        <RelojTiempoReal />
        <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
      </div>
    </header>
  )
}

// Componente para reloj en vivo
const RelojTiempoReal: FC = () => {
  const [hora, setHora] = useState<string>('')

  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date()
      const formateada = ahora.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      setHora(formateada)
    }

    actualizarReloj()
    const intervalo = setInterval(actualizarReloj, 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="hover-highlight-text" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.4rem 0.75rem',
      backgroundColor: 'var(--color-superficie)',
      borderRadius: 'var(--radio-pill)',
      border: '1px solid var(--color-linea)',
      color: 'var(--color-tinta)',
      fontSize: '0.75rem',
      fontWeight: '600',
      letterSpacing: '0.5px'
    }}>
      <Clock size={14} color="var(--color-acento)" />
      <span style={{ minWidth: '60px', textAlign: 'center' }}>{hora || '...'}</span>
    </div>
  )
}
