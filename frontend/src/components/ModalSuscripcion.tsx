import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, X } from 'lucide-react'
import { FormularioSuscripcion } from './FormularioSuscripcion'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import './ModalSuscripcion.css'

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
      className="modal-suscripcion-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-suscripcion"
        className="modal-suscripcion-contenedor"
      >
        {/* Fondo animado morado con orbes fluidos en movimiento */}
        <div className="modal-suscripcion-fondo-animado" aria-hidden="true">
          <div className="orbe-purpura-1" />
          <div className="orbe-purpura-2" />
          <div className="orbe-purpura-3" />
        </div>

        {/* Cabecera del Modal */}
        <div className="modal-suscripcion-cabecera">
          <div className="modal-suscripcion-icono-titulo">
            <div className="modal-suscripcion-badge-icono" aria-hidden="true">
              <BellRing size={24} />
            </div>
            <div className="modal-suscripcion-titulos">
              <h2 id="titulo-modal-suscripcion">Avisos de tu barrio</h2>
              <p>Te notificamos al instante cuando haya cortes o cambios de servicio.</p>
            </div>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar ventana de suscripción"
            className="modal-suscripcion-cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <FormularioSuscripcion sectores={sectores} onFinalizado={onCerrar} />
      </div>
    </div>,
    document.body,
  )
}
