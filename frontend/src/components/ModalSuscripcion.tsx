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
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}>
      <div ref={dialogoRef} className="modal-suscripcion" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-suscripcion">
        <header className="modal-cabecera">
          <span aria-hidden="true"><BellRing size={19} /></span>
          <div><p className="eyebrow">Alertas ciudadanas</p><h2 id="titulo-modal-suscripcion">Configura tus avisos</h2></div>
          <button ref={botonCerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar suscripción"><X size={20} /></button>
        </header>
        <div className="modal-contenido"><FormularioSuscripcion sectores={sectores} /></div>
      </div>
    </div>,
    document.body,
  )
}
