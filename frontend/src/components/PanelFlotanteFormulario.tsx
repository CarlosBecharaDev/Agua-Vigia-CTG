/**
 * PanelFlotanteFormulario — reemplazo del modal centrado a pantalla completa. Se ancla
 * abajo a la izquierda, como un widget de chat, para no tapar el mapa por completo. Cierra
 * con Escape, con el botón de cerrar o al hacer click fuera (capa invisible sin blur: no
 * queremos repetir la "ventana molesta" que oscurece toda la pantalla).
 */
import { useEffect } from 'react'
import type { FC, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  abierto: boolean
  alCerrar: () => void
  titulo: string
  idTitulo: string
  children: ReactNode
}

export const PanelFlotanteFormulario: FC<Props> = ({ abierto, alCerrar, titulo, idTitulo, children }) => {
  useEffect(() => {
    if (!abierto) return
    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar()
    }
    window.addEventListener('keydown', alPresionarTecla)
    return () => window.removeEventListener('keydown', alPresionarTecla)
  }, [abierto, alCerrar])

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <div className="panel-flotante-cortina" onClick={alCerrar} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            className="panel-flotante-formulario"
            initial={{ opacity: 0, y: 20, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: .97 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="panel-flotante-encabezado">
              <h2 id={idTitulo}>{titulo}</h2>
              <button
                type="button"
                onClick={alCerrar}
                aria-label="Cerrar ventana"
                className="hover-glowing panel-flotante-cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="panel-flotante-cuerpo">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
