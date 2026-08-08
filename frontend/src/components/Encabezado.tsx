/**
 * Encabezado principal de AguaVigía CTG.
 * Contiene el logotipo, la navegación principal y el selector de tema.
 * Implementa un efecto realista de AGUA LÍQUIDA (Gooey filter + física de gotas).
 */
import { useState, useEffect, useRef } from 'react'
import type { FC } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { SelectorTema } from './SelectorTema'
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
  transition: 'color var(--transicion)',
})

const AguaEnlace: FC<{ to: string, end?: boolean, children: React.ReactNode }> = ({ to, end, children }) => {
  return (
    <NavLink 
      to={to} 
      end={end} 
      className="hover-glowing nav-link-liquido" 
      style={(props) => ({
        ...estiloNavLink(props),
        position: 'relative',
        zIndex: 10,
      })}
    >
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        {children}
      </span>
    </NavLink>
  )
}

export const Encabezado: FC<Props> = ({ temaActivo, onAlternarTema }) => {
  const headerRef = useRef<HTMLElement>(null)
  const [gotas, setGotas] = useState<{ id: number, x: number, y: number, size: number }[]>([])
  
  // Física del agua: añadir gotas donde pase el cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!headerRef.current) return
    const rect = headerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Crear nueva gota de agua
    const nuevaGota = {
      id: Date.now() + Math.random(),
      x,
      y,
      size: Math.random() * 20 + 30 // Tamaño aleatorio entre 30px y 50px
    }
    
    setGotas(prev => [...prev, nuevaGota])
    
    // La gota desaparece/se evapora después de 800ms
    setTimeout(() => {
      setGotas(prev => prev.filter(g => g.id !== nuevaGota.id))
    }, 800)
  }

  return (
    <>
      {/* Filtro SVG oculto para el efecto líquido (Gooey effect) */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="gooey-agua">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <header
        ref={headerRef}
        role="banner"
        className="panel-glass"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseMove} // Genera splash más grande al hacer clic
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
          overflow: 'hidden', // Evita que el agua salga del contenedor
        }}
      >
        {/* Contenedor Líquido (Física de agua real) */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'url(#gooey-agua)', // ¡Este es el truco del líquido!
        }}>
          {gotas.map(g => (
            <div
              key={g.id}
              className="gota-agua"
              style={{
                position: 'absolute',
                left: g.x,
                top: g.y,
                width: g.size,
                height: g.size,
              }}
            />
          ))}
        </div>

        {/* Logotipo */}
        <Link
          to="/"
          id="logo-aguavigia"
          aria-label="AguaVigía CTG — inicio"
          className="hover-glowing"
          style={{
            position: 'relative',
            zIndex: 10,
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
        <nav aria-label="Navegación principal" style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {ENLACES.map(({ a, etiqueta, Icono }) => (
            <AguaEnlace key={a} to={a} end={a === '/'}>
              <Icono size={18} style={{ marginRight: '6px' }} />
              {etiqueta}
            </AguaEnlace>
          ))}
        </nav>

        {/* Zona de Reloj y Selector de Tema */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <RelojTiempoReal />
          <SelectorTema temaActivo={temaActivo} onAlternar={onAlternarTema} />
        </div>
      </header>
    </>
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
      letterSpacing: '0.5px',
      position: 'relative',
      zIndex: 10,
    }}>
      <Clock size={14} color="var(--color-acento)" />
      <span style={{ minWidth: '60px', textAlign: 'center' }}>{hora || '...'}</span>
    </div>
  )
}
