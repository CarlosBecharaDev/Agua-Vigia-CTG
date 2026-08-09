import { useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BellRing, CheckCircle2 } from 'lucide-react'
import { crearSuscripcion } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import type { Sector } from '../types/tipos-dominio'

export const FormularioSuscripcion: FC<{ sectores: Sector[] }> = ({ sectores }) => {
  const [correo, setCorreo] = useState('')
  const [sectorIds, setSectorIds] = useState<string[]>([])
  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const mutacion = useMutation({ mutationFn: crearSuscripcion })

  const enviar = (event: FormEvent) => {
    event.preventDefault()
    if (!correo.trim() || sectorIds.length === 0) return
    mutacion.mutate({ correo: correo.trim(), sectorIds })
  }

  if (mutacion.isSuccess) {
    return (
      <div className="suscripcion-exito" role="status">
        <CheckCircle2 aria-hidden="true" />
        <div><strong>Revisa tu correo</strong><p>Te enviamos un enlace para confirmar los avisos de tus barrios.</p></div>
      </div>
    )
  }

  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return (
    <form className="formulario-suscripcion" onSubmit={enviar}>
      <div className="suscripcion-titulo"><BellRing aria-hidden="true" /><div><h3>Recibe avisos de tus barrios</h3><p>Solo correo y cambios confirmados. Puedes cancelar cuando quieras.</p></div></div>
      <label htmlFor="correo-suscripcion">Correo electrónico</label>
      <input id="correo-suscripcion" type="email" required autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} placeholder="vecino@correo.com" />
      <fieldset>
        <legend>Barrios que quieres seguir</legend>
        <div className="selector-sectores-suscripcion">
          {opciones.map((sector) => (
            <label key={sector.id}>
              <input
                type="checkbox"
                checked={sectorIds.includes(sector.id)}
                onChange={(event) => setSectorIds((actual) => event.target.checked ? [...actual, sector.id] : actual.filter((id) => id !== sector.id))}
              />
              <span>{sector.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {opciones.length === 0 && <p className="mensaje-campo">Los barrios estarán disponibles cuando el servidor termine de cargarlos.</p>}
      {error && <p className="mensaje-error" role="alert">{error.detalle}</p>}
      <button className="boton boton-primario" type="submit" disabled={mutacion.isPending || sectorIds.length === 0}>
        {mutacion.isPending ? 'Enviando…' : 'Enviar confirmación'}
      </button>
    </form>
  )
}
