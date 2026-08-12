/**
 * WaterField — componente delgado: solo ciclo de vida (refs, efecto, limpieza).
 * Toda la lógica del efecto vive en createWaterField.ts (agnóstico de React).
 *
 * Acepta `children` para poder anidar contenido interactivo (p. ej. el mapa de Leaflet)
 * DENTRO del mismo contenedor que escucha `pointermove` — así el motor sigue recibiendo el
 * puntero aunque ese contenido cubra visualmente el canvas (el evento burbujea hacia
 * arriba). No es parte del motor ni cambia su comportamiento, es cableado de integración.
 */
import { useEffect, useRef } from 'react'
import type { FC, ReactNode } from 'react'
import { createWaterField } from './createWaterField'

interface Props {
  className?: string
  children?: ReactNode
}

export const WaterField: FC<Props> = ({ className, children }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return
    const field = createWaterField(containerRef.current, canvasRef.current)
    return () => field.destroy()
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      {children}
    </div>
  )
}
