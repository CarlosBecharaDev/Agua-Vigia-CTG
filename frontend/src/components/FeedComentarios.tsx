import { useState } from 'react'
import type { FC } from 'react'
import { MessageSquare, ThumbsUp, MapPin, Clock } from 'lucide-react'

// Mock de comentarios recientes de los ciudadanos
const COMENTARIOS_MOCK = [
  {
    id: 1,
    autor: 'Ciudadano Anónimo',
    sector: 'MANGA',
    tiempo: 'Hace 5 minutos',
    texto: 'El agua acaba de irse sin previo aviso. Ayer pasó lo mismo a esta hora.',
    votos: 12,
  },
  {
    id: 2,
    autor: 'Vecino Verificado',
    sector: 'GETSEMANI',
    tiempo: 'Hace 15 minutos',
    texto: 'Reportando presión muy baja cerca de la Plaza de la Trinidad. Apenas sale un hilo.',
    votos: 8,
  },
  {
    id: 3,
    autor: 'Ciudadano Anónimo',
    sector: 'EL LAGUITO',
    tiempo: 'Hace 1 hora',
    texto: 'Ya volvió el servicio, pero el agua está saliendo un poco turbia, dejen la llave abierta un rato.',
    votos: 25,
  }
]

export const FeedComentarios: FC = () => {
  const [votos, setVotos] = useState<Record<number, boolean>>({})

  return (
    <section aria-label="Comentarios recientes de la comunidad" className="feed-comunidad">
      <div className="feed-cabecera">
        <div className="feed-icono">
          <MessageSquare size={20} />
        </div>
        <div>
          <span className="eyebrow">Pulso de la ciudad</span>
          <h2>
            Lo que reportan tus vecinos
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-tinta-2)' }}>
            Comentarios recientes reportados por sector.
          </p>
        </div>
      </div>

      <div className="feed-grid">
        {COMENTARIOS_MOCK.map((comentario) => (
          <article 
            key={comentario.id} 
            className="comentario-card"
            style={{ 
              borderRadius: '1.5rem',
              border: '1px solid var(--color-linea)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.8rem',
              padding: '1.5rem' 
            }}
          >
            {/* Header del comentario (Foto y Nombre) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-tinta)' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-fondo)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-linea)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-acento)' }}>
                  {comentario.autor.charAt(0)}
                </span>
              </div>
              
              {/* Nombres y Tiempo */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', letterSpacing: '-0.2px' }}>{comentario.autor}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-tinta-3)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.1rem' }}>
                  <Clock size={12} /> {comentario.tiempo}
                </span>
              </div>
            </div>

            {/* Cuerpo del comentario */}
            <p style={{ fontSize: '0.85rem', color: 'var(--color-tinta)', lineHeight: '1.5', flex: 1 }}>
              "{comentario.texto}"
            </p>

            {/* Footer del comentario */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-linea)', paddingTop: '0.75rem', marginTop: '0.2rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-acento)', fontWeight: '600', backgroundColor: 'var(--color-superficie)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radio-pill)' }}>
                <MapPin size={12} />
                {comentario.sector}
              </span>
              
              <button
                type="button"
                aria-pressed={Boolean(votos[comentario.id])}
                aria-label={`${votos[comentario.id] ? 'Quitar apoyo a' : 'Apoyar'} este reporte`}
                onClick={() => setVotos((actual) => ({ ...actual, [comentario.id]: !actual[comentario.id] }))}
                className={`boton-apoyo${votos[comentario.id] ? ' activo' : ''}`}
              >
                <ThumbsUp size={14} />
                {comentario.votos + (votos[comentario.id] ? 1 : 0)}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
