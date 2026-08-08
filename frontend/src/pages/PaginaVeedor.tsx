/**
 * PaginaVeedor — M5 (Panel del Veedor - UI).
 * Sprint 3: UI del panel. Requiere C2 abierta para integrar JWT y endpoints.
 */
import { useState } from 'react'
import type { FC } from 'react'

const PaginaVeedor: FC = () => {
  const [autenticado, setAutenticado] = useState(false)
  const [contraseña, setContraseña] = useState('')

  // Flujo mock de autenticación
  const alHacerLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (contraseña === '1234') {
      setAutenticado(true)
    }
  }

  if (!autenticado) {
    return (
      <main id="contenido-principal" role="main" aria-label="Ingreso al panel del veedor">
        <div style={{ padding: '3rem 1.5rem', maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
            Panel del Veedor
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Acceso restringido. Requiere autenticación con token.
          </p>
          <form onSubmit={alHacerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-tinta)', fontWeight: '500' }}>
              Código de acceso temporal (MOCK: usa 1234)
              <input 
                type="password" 
                value={contraseña} 
                onChange={(e) => setContraseña(e.target.value)}
                style={{
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: 'var(--radio-md)',
                  border: '1px solid var(--color-linea)',
                  backgroundColor: 'var(--color-superficie)'
                }}
              />
            </label>
            <button
              type="submit"
              disabled={!contraseña}
              style={{
                backgroundColor: contraseña ? 'var(--color-acento)' : 'var(--color-linea)',
                color: contraseña ? '#FFF' : 'var(--color-tinta-3)',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 'var(--radio-md)',
                fontWeight: '600',
                cursor: contraseña ? 'pointer' : 'not-allowed'
              }}
            >
              Ingresar
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Dashboard del veedor">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--color-tinta)' }}>
            Panel de Moderación
          </h1>
          <button 
            onClick={() => setAutenticado(false)}
            style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radio-base)', border: '1px solid var(--color-linea)', background: 'var(--color-superficie)' }}
          >
            Salir
          </button>
        </div>

        {/* 1. Registrar corte oficial (RF016) */}
        <section style={{ backgroundColor: 'var(--color-superficie)', padding: '1.5rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-tinta)' }}>Registrar corte oficial</h2>
          <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Registra una falla o mantenimiento oficial anunciado por el operador.
          </p>
          <button style={{ backgroundColor: 'var(--color-estado-sin)', color: '#FFF', padding: '0.75rem 1rem', border: 'none', borderRadius: 'var(--radio-base)', fontWeight: '600' }}>
            + Nuevo Registro
          </button>
        </section>

        {/* 2. Moderar reportes (RF018) */}
        <section style={{ backgroundColor: 'var(--color-superficie)', padding: '1.5rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--color-tinta)' }}>Reportes ciudadanos dudosos</h2>
          
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {/* Mock data de reportes */}
            <li style={{ padding: '1rem 0', borderBottom: '1px solid var(--color-linea)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--color-tinta)' }}>MANGA</strong>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-tinta-2)' }}>Reportó SIN AGUA - hace 5 min</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-estado-con)', color: 'var(--color-estado-con)', backgroundColor: 'transparent', borderRadius: 'var(--radio-base)' }}>Aprobar</button>
                <button style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-estado-sin)', color: 'var(--color-estado-sin)', backgroundColor: 'transparent', borderRadius: 'var(--radio-base)' }}>Descartar</button>
              </div>
            </li>
          </ul>
        </section>
        
      </div>
    </main>
  )
}

export default PaginaVeedor
