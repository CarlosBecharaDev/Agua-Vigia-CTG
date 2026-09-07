import * as Dialog from '@radix-ui/react-dialog'
import { BellRing, X } from 'lucide-react'
import { FormularioSuscripcion } from './FormularioSuscripcion'
import type { EstadoRecurso } from '../hooks/useDatosEnVivo'
import type { Sector } from '../types/tipos-dominio'
import './ModalSuscripcion.css'

interface Props {
  abierto: boolean
  onCerrar: () => void
  sectores: Sector[]
  estadoDatos: EstadoRecurso
  errorDatos: string | null
  onRecargarDatos: () => void
}

export function ModalSuscripcion({
  abierto,
  onCerrar,
  sectores,
  estadoDatos,
  errorDatos,
  onRecargarDatos,
}: Props) {
  return (
    <Dialog.Root open={abierto} onOpenChange={(sigueAbierto) => { if (!sigueAbierto) onCerrar() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-suscripcion-backdrop">
          <Dialog.Content className="modal-suscripcion-contenedor">
        {/* Cabecera del Modal */}
        <div className="modal-suscripcion-cabecera">
          <div className="modal-suscripcion-icono-titulo">
            <div className="modal-suscripcion-badge-icono" aria-hidden="true">
              <BellRing size={24} />
            </div>
            <div className="modal-suscripcion-titulos">
              <Dialog.Title asChild>
                <h2 id="titulo-modal-suscripcion">Avisos de tu barrio</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p>Te notificamos al instante cuando haya cortes o cambios de servicio.</p>
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Cerrar ventana de suscripción"
              className="modal-suscripcion-cerrar"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </div>

        {estadoDatos === 'error' || estadoDatos === 'unavailable' ? (
          <div className="form-suscripcion-error-badge" role="alert">
            <span>{errorDatos || 'No pudimos cargar la lista de barrios.'}</span>
            <button type="button" onClick={onRecargarDatos}>Reintentar</button>
          </div>
        ) : (
          <FormularioSuscripcion sectores={sectores} onFinalizado={onCerrar} />
        )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
