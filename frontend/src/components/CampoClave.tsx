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
        <Icono size={15} color="#d8b4fe" />
        {etiqueta}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
          className="form-suscripcion-input"
          style={{ paddingRight: '2.75rem', width: '100%' }}
          aria-describedby={`${id}-pista`}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar clave' : 'Mostrar clave'}
          onClick={() => setVisible((actual) => !actual)}
          style={{
            position: 'absolute',
            right: '0.75rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(203, 213, 225, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {/* RNF016: el cumplimiento no se comunica solo por color — el texto lo dice. */}
      <p id={`${id}-pista`} className="cuenta-pista">
        {suficiente
          ? `✓ Cumple el mínimo de ${LONGITUD_MINIMA_CLAVE} caracteres.`
          : `Mínimo ${LONGITUD_MINIMA_CLAVE} caracteres. Una frase larga es más segura y más fácil de recordar que un jeroglífico corto.`}
      </p>
    </div>
  )
}
