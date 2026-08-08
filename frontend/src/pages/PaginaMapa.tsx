/**
 * PaginaMapa — placeholder para M1 (Mapa en vivo).
 *
 * Sprint 0: muestra el estado de la compuerta C2 que habilita la integración real.
 * El mapa con Leaflet y sectores reales de Cartagena se implementa en Sprint 1,
 * cuando C2 esté abierta y el contrato OpenAPI (GET /api/sectores) esté disponible.
 *
 * WCAG: incluye alternativa textual al mapa (RF004) desde el diseño inicial.
 */
import type { FC } from 'react'

const PaginaMapa: FC = () => (
  <main id="contenido-principal" role="main" aria-label="Mapa en vivo del servicio de agua">
    {/* La pregunta principal — respuesta en < 5 s (DESIGN.md §1) */}
    <div
      style={{
        backgroundColor: 'var(--color-superficie)',
        borderBottom: '1px solid var(--color-linea)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <span
        aria-label="Estado del servicio: pendiente de datos"
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-tinta-3)',
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--color-tinta)' }}>
        Conectando con la API de sectores…
      </p>
    </div>

    {/* Área del mapa */}
    <div
      role="img"
      aria-label="Mapa de sectores de Cartagena — pendiente de datos del servidor"
      style={{
        height: 'calc(100dvh - 120px)',
        backgroundColor: 'var(--color-fondo)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        borderRadius: 0,
      }}
    >
      <p style={{ color: 'var(--color-tinta-2)', fontFamily: 'var(--font-util)', fontSize: '0.875rem' }}>
        Sprint 1 · Pendiente de <strong>C2</strong> (contrato OpenAPI)
      </p>
      <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.8rem', textAlign: 'center', maxWidth: '30ch' }}>
        El mapa con sectores reales de Cartagena se carga cuando D3 publique
        <code style={{ fontFamily: 'var(--font-util)' }}> /api/sectores</code>.
      </p>
    </div>

    {/* Alternativa textual al mapa — RF004, DESIGN.md §6, WCAG */}
    <section
      aria-label="Lista de sectores — alternativa accesible al mapa"
      style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--color-linea)' }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          marginBottom: '0.75rem',
          color: 'var(--color-tinta)',
        }}
      >
        Estado por sector
      </h2>
      <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.875rem' }}>
        La lista de sectores con su estado se mostrará aquí cuando los datos estén disponibles.
        Esta sección es la alternativa de texto al mapa para lectores de pantalla.
      </p>
    </section>
  </main>
)

export default PaginaMapa
