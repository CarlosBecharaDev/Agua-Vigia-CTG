/**
 * PaginaBitacora — M8 (Bitácora pública - UI).
 * Sprint 4: Se implementa la interfaz visual usando mock data.
 * Se conecta a GET /api/bitacora cuando D1 publique C2.
 */
import type { FC } from 'react'
import { InsigniaEstado } from '../components/InsigniaEstado'

// MOCK DATA - Eventos de la bitácora
const MOCK_EVENTOS = [
  {
    id: 'ev-001',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    sector: 'MANGA',
    tipo: 'CONFIRMADO_POR_CONSENSO',
    descripcion: 'Corte confirmado por reporte de vecinos (5 reportes).',
    estadoRelacionado: 'SIN_SERVICIO' as const
  },
  {
    id: 'ev-002',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    sector: 'BOCAGRANDE',
    tipo: 'CORTE_OFICIAL_ANUNCIADO',
    descripcion: 'Mantenimiento preventivo en tubería principal.',
    estadoRelacionado: 'CORTE_PROGRAMADO' as const
  },
  {
    id: 'ev-003',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    sector: 'GETSEMANI',
    tipo: 'SERVICIO_RESTABLECIDO',
    descripcion: 'Servicio reanudado oficialmente.',
    estadoRelacionado: 'CON_SERVICIO' as const
  }
]

// Formateador de fecha simple
const formatearFecha = (isoString: string) => {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat('es-CO', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(d)
}

const PaginaBitacora: FC = () => {
  return (
    <main id="contenido-principal" role="main" aria-label="Bitácora pública de interrupciones del servicio">
      <div style={{ padding: '2rem 1.25rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
          Bitácora Pública
        </h1>
        <p style={{ color: 'var(--color-tinta-2)', fontSize: '1rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          Registro inmutable (RF028) de todos los eventos del acueducto reportados u oficializados.
          Totalmente público y transparente (RF027).
        </p>

        <div
          role="note"
          style={{
            backgroundColor: 'var(--color-fondo)',
            border: '1px solid var(--color-linea)',
            borderRadius: 'var(--radio-md)',
            padding: '0.75rem',
            marginBottom: '2rem',
            fontSize: '0.75rem',
            color: 'var(--color-tinta-2)'
          }}
        >
          ⚠️ <strong>Mock Data:</strong> La UI está lista, esperando que D1 abra C2 para conectarla a la API.
        </div>

        {/* Timeline de Eventos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {MOCK_EVENTOS.map(evento => (
            <article 
              key={evento.id}
              style={{
                display: 'flex',
                gap: '1rem',
                backgroundColor: 'var(--color-superficie)',
                padding: '1.5rem',
                borderRadius: 'var(--radio-md)',
                border: '1px solid var(--color-linea)',
                position: 'relative'
              }}
            >
              {/* Línea vertical decorativa */}
              <div style={{ width: '4px', backgroundColor: 'var(--color-linea)', borderRadius: '2px' }} />
              
              <div style={{ flex: 1 }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-tinta)', fontFamily: 'var(--font-display)' }}>
                      {evento.sector}
                    </h2>
                    <time dateTime={evento.timestamp} style={{ fontSize: '0.8rem', color: 'var(--color-tinta-3)' }}>
                      {formatearFecha(evento.timestamp)}
                    </time>
                  </div>
                  <InsigniaEstado estado={evento.estadoRelacionado} tamaño="sm" />
                </header>
                
                <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.95rem', margin: 0, lineHeight: '1.4' }}>
                  <strong>{evento.tipo.replace(/_/g, ' ')}:</strong> {evento.descripcion}
                </p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </main>
  )
}

export default PaginaBitacora
