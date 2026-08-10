import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  ultimaActualizacion: string | null
}

function calcularHaceCuanto(fechaIso: string): string {
  const ahora = Date.now()
  const fecha = new Date(fechaIso).getTime()
  const diffSegundos = Math.floor((ahora - fecha) / 1000)

  if (diffSegundos < 60) return 'hace unos segundos'
  const diffMinutos = Math.floor(diffSegundos / 60)
  if (diffMinutos === 1) return 'hace 1 minuto'
  if (diffMinutos < 60) return `hace ${diffMinutos} minutos`
  const diffHoras = Math.floor(diffMinutos / 60)
  if (diffHoras === 1) return 'hace 1 hora'
  return `hace ${diffHoras} horas`
}

export const IndicadorFrescura: FC<Props> = ({ ultimaActualizacion }) => {
  const [texto, setTexto] = useState<string>('Actualizando...')

  useEffect(() => {
    if (!ultimaActualizacion) {
      setTexto('Actualizando...')
      return
    }

    const actualizar = () => setTexto(`Actualizado ${calcularHaceCuanto(ultimaActualizacion)}`)
    
    actualizar()
    const intervalo = setInterval(actualizar, 60000) // Actualiza cada minuto
    return () => clearInterval(intervalo)
  }, [ultimaActualizacion])

  return (
    <div 
      title={ultimaActualizacion ? new Date(ultimaActualizacion).toLocaleString() : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.85rem',
        color: 'var(--color-tinta-3)',
        backgroundColor: 'var(--color-fondo-2)',
        padding: '0.35rem 0.75rem',
        borderRadius: 'var(--radio-pill)',
        border: '1px solid var(--color-linea)',
        fontWeight: '500'
      }}
    >
      <Clock size={14} />
      <span>{texto}</span>
    </div>
  )
}
