/**
 * Stepper — asistente de pasos con el estilo de reactbits.dev (Components → Stepper):
 * indicador de círculos numerados conectados por una línea que se rellena, y contenido
 * animado con framer-motion al avanzar o retroceder. El estado de "qué paso está activo"
 * y "puede avanzar" lo controla quien lo usa — este componente solo dibuja y anima.
 */
import { Children } from 'react'
import type { FC, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import './Stepper.css'

export const Step: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>

interface Props {
  children: ReactNode
  pasoActivo: number
  totalPasos: number
  puedeAvanzar: boolean
  enviando?: boolean
  onAtras: () => void
  onSiguiente: () => void
  textoAtras?: string
  textoSiguiente?: string
  textoFinalizar?: string
}

export const Stepper: FC<Props> = ({
  children,
  pasoActivo,
  totalPasos,
  puedeAvanzar,
  enviando = false,
  onAtras,
  onSiguiente,
  textoAtras = 'Atrás',
  textoSiguiente = 'Siguiente',
  textoFinalizar = 'Enviar',
}) => {
  const pasos = Children.toArray(children)
  const esUltimoPaso = pasoActivo === totalPasos

  return (
    <div className="stepper">
      <div className="stepper-indicador" role="list" aria-label={`Paso ${pasoActivo} de ${totalPasos}`}>
        {Array.from({ length: totalPasos }, (_, indice) => indice + 1).map((numero) => (
          <div key={numero} className="stepper-indicador-item" role="listitem">
            <span
              className={`stepper-circulo${numero === pasoActivo ? ' stepper-circulo-activo' : ''}${numero < pasoActivo ? ' stepper-circulo-completo' : ''}`}
              aria-current={numero === pasoActivo ? 'step' : undefined}
            >
              {numero < pasoActivo ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : numero}
            </span>
            {numero < totalPasos && (
              <span className={`stepper-linea${numero < pasoActivo ? ' stepper-linea-completa' : ''}`} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <div className="stepper-viewport">
        <motion.div
          key={pasoActivo}
          className="stepper-paso"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        >
          {pasos[pasoActivo - 1]}
        </motion.div>
      </div>

      <div className="stepper-pie">
        <button
          type="button"
          className="stepper-boton stepper-boton-atras"
          onClick={onAtras}
          disabled={pasoActivo === 1 || enviando}
        >
          {textoAtras}
        </button>
        <button
          type="button"
          className="stepper-boton stepper-boton-siguiente"
          onClick={onSiguiente}
          disabled={!puedeAvanzar || enviando}
        >
          {enviando ? 'Enviando…' : esUltimoPaso ? textoFinalizar : textoSiguiente}
        </button>
      </div>
    </div>
  )
}
