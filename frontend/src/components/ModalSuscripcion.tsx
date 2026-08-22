import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, X } from 'lucide-react'
import { FormularioSuscripcion } from './FormularioSuscripcion'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'

interface Props {
  abierto: boolean
  onCerrar: () => void
}

export function ModalSuscripcion({ abierto, onCerrar }: Props) {
  const dialogoRef = useRef<HTMLDivElement>(null)
  const botonCerrarRef = useRef<HTMLButtonElement>(null)
  const { sectores } = useDatosEnVivo()

  useEffect(() => {
    if (!abierto) return

    const scrollAnterior = document.body.style.overflow
    const activoAnterior = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    botonCerrarRef.current?.focus()

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar()
      if (event.key !== 'Tab' || !dialogoRef.current) return

      const enfocables = Array.from(dialogoRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href]'))
      if (enfocables.length === 0) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)
    return () => {
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = scrollAnterior
      activoAnterior?.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}
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
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-suscripcion"
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
          ref={botonCerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar ventana de suscripción"
          className="hover-glowing"
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-tinta-2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '50%',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span aria-hidden="true"><BellRing size={19} /></span>
          <h2 id="titulo-modal-suscripcion" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-tinta)' }}>
            Avisos de tu barrio
          </h2>
        </div>

        <FormularioSuscripcion sectores={sectores} />
      </div>
    </div>,
    document.body,
  )
}
