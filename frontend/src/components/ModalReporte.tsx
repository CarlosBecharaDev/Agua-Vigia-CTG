import { useState } from 'react'
import type { FC } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { FormularioReporte } from './FormularioReporte'
import { EnlaceConfirmarReporte } from './EnlaceConfirmarReporte'
import { X, CheckCircle, Megaphone } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'
import type { ReporteRespuesta } from '../api/services'
import './ModalReporte.css'

interface Props {
  abierto: boolean
  alCerrar: () => void
  sectores: Sector[]
  sectorPreseleccionado?: string
}

export const ModalReporte: FC<Props> = ({ abierto, alCerrar, sectores, sectorPreseleccionado }) => {
  const [reporteExitoso, setReporteExitoso] = useState<ReporteRespuesta | null>(null)
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null)
  return (
    <Dialog.Root open={abierto} onOpenChange={(sigueAbierto) => { if (!sigueAbierto) alCerrar() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-reporte-backdrop">
          <Dialog.Content className="modal-reporte-contenedor">
        {/* Cabecera */}
        <div className="modal-reporte-cabecera">
          <div className="modal-reporte-icono-titulo">
            <div className="modal-reporte-badge-icono" aria-hidden="true">
              <Megaphone size={24} />
            </div>
            <div className="modal-reporte-titulos">
              <Dialog.Title asChild>
                <h2 id="titulo-modal-reporte">Reportar estado</h2>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p>Tu reporte ciudadano ayuda a validar el servicio en tu barrio.</p>
              </Dialog.Description>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Cerrar ventana de reporte"
              className="modal-reporte-cerrar"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </div>

        {reporteExitoso ? (
          <div className="suscripcion-exito-moderno">
            <div className="suscripcion-exito-icono">
              <CheckCircle size={36} />
            </div>
            <div className="suscripcion-exito-titulos">
              <h3>Reporte recibido</h3>
              <p>
                Gracias por ser un AguaVigía. Tu reporte ha sido registrado en el consenso comunitario de Cartagena.
              </p>
            </div>

            {avisoFoto && (
              <p className="form-suscripcion-error-badge" role="alert">{avisoFoto}</p>
            )}

            {reporteExitoso?.id && <EnlaceConfirmarReporte reporteId={reporteExitoso.id} />}

            <Dialog.Close asChild>
              <button className="form-suscripcion-boton-enviar boton-reporte-secundario">
                Cerrar y volver al mapa
              </button>
            </Dialog.Close>
          </div>
        ) : (
          <FormularioReporte
            sectores={sectores}
            sectorPreseleccionado={sectorPreseleccionado}
            onReporteEnviado={(reporte, aviso) => { setReporteExitoso(reporte); setAvisoFoto(aviso ?? null) }}
          />
        )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
