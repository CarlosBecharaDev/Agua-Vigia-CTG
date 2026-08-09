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
  return (
    <section aria-label="Comentarios recientes de la comunidad" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
        <div style={{ backgroundColor: 'var(--color-acento)', padding: '0.6rem', borderRadius: 'var(--radio-md)', color: '#fff' }}>
          <MessageSquare size={20} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '700', color: 'var(--color-tinta)' }}>
            Voz Comunitaria
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-tinta-2)' }}>
            Últimos comentarios reportados por tus vecinos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COMENTARIOS_MOCK.map((comentario) => (
          <article 
            key={comentario.id} 
            className="panel-glass shadow-lg"
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-tinta-2)', fontSize: '0.8rem', fontWeight: '600', transition: 'color var(--transicion)' }}
                className="hover-glowing"
              >
                <ThumbsUp size={14} />
                {comentario.votos}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
