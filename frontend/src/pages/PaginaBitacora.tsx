/**
 * PaginaBitacora — placeholder para M8 (Bitácora pública).
 * Responsable principal: D1. D4 implementa el frontend en Sprint 4.
 */
import type { FC } from 'react'

const PaginaBitacora: FC = () => (
  <main id="contenido-principal" role="main" aria-label="Bitácora pública de interrupciones del servicio">
    <div style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
        Bitácora de interrupciones
      </h1>
      <p style={{ color: 'var(--color-tinta-2)' }}>
        El historial de cortes programados y reportados se mostrará aquí. Backend a cargo de D1
        (<code style={{ fontFamily: 'var(--font-util)' }}>GET /api/bitacora</code>), Sprint 3.
        Frontend de D4 en Sprint 4.
      </p>
    </div>
  </main>
)

export default PaginaBitacora
