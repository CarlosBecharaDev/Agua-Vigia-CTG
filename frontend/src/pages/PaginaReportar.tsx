/**
 * PaginaReportar — M2 (Reporte ciudadano - UI).
 * Sprint 2: UI del formulario construida. Usa datos mock
 * (SECTORES_MOCK) porque C2 (OpenAPI) está cerrada.
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { FormularioReporte } from '../components/FormularioReporte'

const PaginaReportar: FC = () => {
  const [exito, setExito] = useState(false)
  const [sectorPreseleccionado, setSectorPreseleccionado] = useState('')

  // Leer parámetro de URL si el usuario vino del mapa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sector = params.get('sector')
    if (sector) {
      setSectorPreseleccionado(sector)
    }
  }, [])

  if (exito) {
    return (
      <main id="contenido-principal" role="main" aria-label="Reporte enviado con éxito">
        <div style={{ padding: '3rem 1.5rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-tinta)' }}>
            ¡Reporte recibido!
          </h1>
          <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', lineHeight: '1.5' }}>
            Gracias por reportar. Tu información es valiosa para construir el consenso
            y mantener el mapa actualizado para todos los vecinos.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--color-acento)',
              color: '#FFF',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radio-md)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Volver al mapa
          </a>
        </div>
      </main>
    )
  }

  return (
    <main id="contenido-principal" role="main" aria-label="Reportar problema con el servicio de agua">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Aviso de datos simulados */}
        <div
          role="note"
          aria-label="Formulario usando datos simulados"
          style={{
            backgroundColor: 'var(--color-fondo)',
            border: '1px solid var(--color-linea)',
            borderRadius: 'var(--radio-md)',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            fontSize: '0.75rem',
            color: 'var(--color-tinta-2)'
          }}
        >
          ⚠️ <strong>Sprint 2:</strong> Este formulario muestra la UI, pero el envío
          es simulado porque el backend aún no ha publicado el contrato de la API (C2 cerrada).
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
          Reportar estado
        </h1>
        <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Por favor, indícanos cómo está el servicio en tu barrio ahora mismo. Tu reporte ayuda a validar el consenso comunitario.
        </p>

        <div className="panel-glass" style={{ padding: '2rem', borderRadius: '1.5rem', marginTop: '1rem', border: '1px solid var(--color-linea)' }}>
          <FormularioReporte 
            sectorPreseleccionado={sectorPreseleccionado}
            onReporteEnviado={() => setExito(true)}
          />
        </div>

        <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.75rem', marginTop: '2.5rem', textAlign: 'center' }}>
          Tus datos son anónimos. Si tienes una emergencia o daño grave, contacta a Acuacar directamente al 604 660 3030.
        </p>
      </div>
    </main>
  )
}

export default PaginaReportar
