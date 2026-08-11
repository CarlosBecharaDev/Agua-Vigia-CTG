import type { FC } from 'react'
import { FormularioSuscripcion } from './FormularioSuscripcion'
import { X } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'

interface Props {
  abierto: boolean
  alCerrar: () => void
  sectores: Sector[]
}

export const ModalSuscripcion: FC<Props> = ({ abierto, alCerrar, sectores }) => {
  if (!abierto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-suscripcion"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
      onClick={alCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radio-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--color-linea)',
          backgroundColor: 'var(--color-superficie)',
          padding: '2rem 1.5rem',
        }}
      >
        <button
          onClick={alCerrar}
          aria-label="Cerrar ventana de suscripción"
          className="hover-glowing"
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-tinta-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            width: '32px', height: '32px', borderRadius: '50%',
          }}
        >
          <X size={20} />
        </button>

        <h2 id="titulo-modal-suscripcion" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.25rem', color: 'var(--color-tinta)' }}>
          Avisos de tu barrio
        </h2>

        <FormularioSuscripcion sectores={sectores} />
      </div>
    </div>
  )
}
