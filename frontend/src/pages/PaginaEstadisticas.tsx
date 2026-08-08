/**
 * PaginaEstadisticas — placeholder para M7 (Estadísticas).
 * Responsable principal: D5. D4 integra la visualización con Recharts en Sprint 4.
 */
import type { FC } from 'react'

const PaginaEstadisticas: FC = () => (
  <main id="contenido-principal" role="main" aria-label="Estadísticas del servicio de agua en Cartagena">
    <div style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
        Estadísticas
      </h1>
      <p style={{ color: 'var(--color-tinta-2)' }}>
        Las visualizaciones de Recharts se integran en el Sprint 4, junto con el
        Índice de Cumplimiento (M6). Módulo M7 a cargo de D5.
      </p>
    </div>
  </main>
)

export default PaginaEstadisticas
