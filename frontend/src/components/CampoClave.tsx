import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Debe coincidir con ClaveEnClaro.LONGITUD_MINIMA del backend: es quien rechaza de verdad. */
export const LONGITUD_MINIMA_CLAVE = 12

interface Props {
  id: string
  etiqueta: string
  icono: LucideIcon
  valor: string
  onCambio: (valor: string) => void
}

/**
 * Campo de clave nueva con su política a la vista. El medidor no bloquea nada —la validación real
 * está en el backend, que es el único sitio donde no se puede saltar— pero decir el requisito antes
 * de enviar evita el ciclo de escribir, fallar y volver a empezar.
 */
export function CampoClave({ id, etiqueta, icono: Icono, valor, onCambio }: Props) {
  const [visible, setVisible] = useState(false)
  const suficiente = valor.length >= LONGITUD_MINIMA_CLAVE

  return (
    <div className="form-reporte-bloque">
      <label htmlFor={id} className="form-reporte-label">
        <Icono size={15} aria-hidden="true" />
        {etiqueta}
      </label>
      <div className="campo-clave-con-accion">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={LONGITUD_MINIMA_CLAVE}
          maxLength={128}
          autoComplete="new-password"
          placeholder={`Al menos ${LONGITUD_MINIMA_CLAVE} caracteres`}
          value={valor}
          onChange={(event) => onCambio(event.target.value)}
          className="form-suscripcion-input campo-clave-input"
          aria-describedby={`${id}-pista`}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar clave' : 'Mostrar clave'}
          onClick={() => setVisible((actual) => !actual)}
          className="campo-clave-boton"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {/* RNF016: el cumplimiento no se comunica solo por color — el texto lo dice. */}
      <p id={`${id}-pista`} className="cuenta-pista">
        {suficiente
          ? `Cumple el mínimo de ${LONGITUD_MINIMA_CLAVE} caracteres.`
          : `Mínimo ${LONGITUD_MINIMA_CLAVE} caracteres. Una frase larga es más segura y más fácil de recordar que un jeroglífico corto.`}
      </p>
    </div>
  )
}
