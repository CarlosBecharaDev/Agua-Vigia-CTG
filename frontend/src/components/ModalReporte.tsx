import { useState, useEffect, useRef } from 'react'
import type { FC } from 'react'
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
  const dialogoRef = useRef<HTMLDivElement>(null)
  const botonCerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (abierto) { setReporteExitoso(null); setAvisoFoto(null) }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return

    const scrollAnterior = document.body.style.overflow
    const activoAnterior = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    botonCerrarRef.current?.focus()

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') alCerrar()
      if (event.key !== 'Tab' || !dialogoRef.current) return

      const enfocables = Array.from(dialogoRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], select:not([disabled])'))
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
  }, [abierto, alCerrar])

  if (!abierto) return null

  return (
    <div
      role="presentation"
      className="modal-reporte-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) alCerrar() }}
    >
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-reporte"
        className="modal-reporte-contenedor"
      >
        {/* Fondo animado morado */}
        <div className="modal-reporte-fondo-animado" aria-hidden="true">
          <div className="orbe-rep-1" />
          <div className="orbe-rep-2" />
        </div>

        {/* Cabecera */}
        <div className="modal-reporte-cabecera">
          <div className="modal-reporte-icono-titulo">
            <div className="modal-reporte-badge-icono" aria-hidden="true">
              <Megaphone size={24} />
            </div>
            <div className="modal-reporte-titulos">
              <h2 id="titulo-modal-reporte">Reportar estado</h2>
              <p>Tu reporte ciudadano ayuda a validar el servicio en tu barrio.</p>
            </div>
          </div>
          <button
            ref={botonCerrarRef}
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar ventana de reporte"
            className="modal-reporte-cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {reporteExitoso ? (
          <div className="suscripcion-exito-moderno" style={{ padding: '1.5rem 0' }}>
            <div className="suscripcion-exito-icono">
              <CheckCircle size={36} />
            </div>
            <div className="suscripcion-exito-titulos">
              <h3>¡Reporte Recibido!</h3>
              <p>
                Gracias por ser un AguaVigía. Tu reporte ha sido registrado en el consenso comunitario de Cartagena.
              </p>
            </div>

            {avisoFoto && (
              <p className="form-suscripcion-error-badge" role="alert">{avisoFoto}</p>
            )}

            {reporteExitoso?.id && <EnlaceConfirmarReporte reporteId={reporteExitoso.id} />}

            <button
              onClick={alCerrar}
              className="form-suscripcion-boton-enviar"
              style={{ maxWidth: '240px', marginTop: '0.5rem' }}
            >
              Cerrar y Volver al Mapa
            </button>
          </div>
        ) : (
          <FormularioReporte
            sectores={sectores}
            sectorPreseleccionado={sectorPreseleccionado}
            onReporteEnviado={(reporte, aviso) => { setReporteExitoso(reporte); setAvisoFoto(aviso ?? null) }}
          />
        )}
      </div>
    </div>
  )
}
