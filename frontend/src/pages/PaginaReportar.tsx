/**
 * PaginaReportar — placeholder para M2 (Reporte ciudadano - UI).
 * Se implementa en Sprint 2. Requiere C2 abierta para conocer
 * el contrato de POST /api/reportes.
 */
import type { FC } from 'react'

const PaginaReportar: FC = () => (
  <main id="contenido-principal" role="main" aria-label="Reportar problema con el servicio de agua">
    <div style={{ padding: '2rem 1rem', maxWidth: '500px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
        Reportar que no tengo agua
      </h1>
      <p style={{ color: 'var(--color-tinta-2)', marginBottom: '1.5rem' }}>
        Este formulario estará disponible en el Sprint 2, cuando el contrato de la API
        (<code style={{ fontFamily: 'var(--font-util)' }}>POST /api/reportes</code>) esté publicado
        por D3. El formulario tendrá máximo 2 toques desde el mapa.
      </p>
      <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.875rem' }}>
        Mientras tanto, si tienes un problema urgente, contacta a Acuacar al{' '}
        <a
          href="tel:6046603030"
          style={{ color: 'var(--color-acento)', textDecoration: 'underline' }}
        >
          604 660 3030
        </a>.
      </p>
    </div>
  </main>
)

export default PaginaReportar
