/**
 * PaginaReportar — M2 (Reporte ciudadano - UI).
 * Integrado con la API real (Compuerta C3).
 */
import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { FormularioReporte } from '../components/FormularioReporte'
import { AguaVigiaAPI } from '../api/services'
import { PageWrapper } from '../components/PageWrapper'

const PaginaReportar: FC = () => {
  const [exito, setExito] = useState(false)
  const [sectorPreseleccionado, setSectorPreseleccionado] = useState('')
  const [sectores, setSectores] = useState<{id: string, nombre: string}[]>([])

  // Leer parámetro de URL y cargar sectores
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sector = params.get('sector')
    if (sector) {
      setSectorPreseleccionado(sector)
    }

    AguaVigiaAPI.obtenerSectores()
      .then((res: any) => {
        if (res && res.sectores) {
          setSectores(res.sectores);
        }
      })
      .catch(err => {
        console.warn("API de sectores no disponible", err);
      });
  }, [])

  if (exito) {
    return (
      <PageWrapper>
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
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" role="main" aria-label="Reportar problema con el servicio de agua">
        <div style={{ padding: '2rem 1.25rem', maxWidth: '500px', margin: '0 auto' }}>
        
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
          Reportar estado
        </h1>
        <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Por favor, indícanos cómo está el servicio en tu barrio ahora mismo. Tu reporte ayuda a validar el consenso comunitario.
        </p>

        <div className="panel-glass" style={{ padding: '2rem', borderRadius: '1.5rem', marginTop: '1rem', border: '1px solid var(--color-linea)' }}>
          <FormularioReporte 
            sectores={sectores}
            sectorPreseleccionado={sectorPreseleccionado}
            onReporteEnviado={() => setExito(true)}
          />
        </div>

        <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.75rem', marginTop: '2.5rem', textAlign: 'center' }}>
          Tus datos son anónimos. Si tienes una emergencia o daño grave, contacta a Acuacar directamente al 604 660 3030.
        </p>
      </div>
      </main>
    </PageWrapper>
  )
}

export default PaginaReportar
