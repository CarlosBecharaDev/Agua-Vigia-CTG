import { useState } from 'react'
import type { FC } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  reporteId: string
}

/** Enlace de "¿tú también?" (RF038/M11) para compartir tras enviar un reporte propio. */
export const EnlaceConfirmarReporte: FC<Props> = ({ reporteId }) => {
  const [copiado, setCopiado] = useState(false)
  const enlace = `${window.location.origin}/confirmar/${reporteId}`

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso del portapapeles: el enlace sigue visible en pantalla para copiar a mano.
    }
  }

  return (
    <div className="enlace-confirmar-reporte">
      <p>Comparte este enlace para que un vecino lo confirme</p>
      <div className="enlace-confirmar-reporte-fila">
        <small>{enlace}</small>
        <button type="button" onClick={() => void copiar()} aria-label="Copiar enlace para confirmar" className="hover-glowing">
          {copiado ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}
