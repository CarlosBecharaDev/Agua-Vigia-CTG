import { useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BellRing, Check, CheckCircle2, Mail, Search, X } from 'lucide-react'
import { crearSuscripcion } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import type { Sector } from '../types/tipos-dominio'

export const FormularioSuscripcion: FC<{ sectores: Sector[] }> = ({ sectores }) => {
  const [correo, setCorreo] = useState('')
  const [sectorIds, setSectorIds] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const opcionesVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    return termino ? opciones.filter((sector) => sector.nombre.toLocaleLowerCase('es').includes(termino)) : opciones
  }, [busqueda, opciones])
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
      <div className="suscripcion-intro">
        <span className="suscripcion-icono"><BellRing aria-hidden="true" /></span>
        <div><p className="eyebrow">Alertas ciudadanas</p><h2>Recibe avisos de tus barrios</h2><p>Solo correo y cambios confirmados. Puedes cancelar cuando quieras.</p></div>
      </div>
      <div className="suscripcion-pasos" aria-hidden="true"><span className={correo ? 'completo' : 'activo'}>1</span><i /><span className={sectorIds.length ? 'completo' : correo ? 'activo' : ''}>2</span><i /><span className={correo && sectorIds.length ? 'activo' : ''}>3</span></div>
      <div className="suscripcion-grid">
        <div className="paso-formulario">
          <span className="paso-numero">Paso 1</span>
          <label htmlFor="correo-suscripcion">Correo electrónico</label>
          <div className="campo-con-icono"><Mail aria-hidden="true" /><input id="correo-suscripcion" type="email" required autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} placeholder="vecino@correo.com" /></div>
          <p className="mensaje-campo">Usaremos esta dirección únicamente para tus avisos.</p>
        </div>
        <fieldset className="paso-formulario selector-suscripcion">
          <legend><span className="paso-numero">Paso 2</span>Barrios que quieres seguir</legend>
          <div className="selector-meta"><strong>{sectorIds.length} {sectorIds.length === 1 ? 'barrio seleccionado' : 'barrios seleccionados'}</strong>{sectorIds.length > 0 && <button type="button" onClick={() => setSectorIds([])}>Limpiar</button>}</div>
          <label className="buscador-barrios buscador-suscripcion"><Search size={17} aria-hidden="true" /><span className="sr-only">Buscar barrio para seguir</span><input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar barrio…" />{busqueda && <button type="button" aria-label="Limpiar búsqueda de barrios" onClick={() => setBusqueda('')}><X size={15} /></button>}</label>
          <div className="selector-sectores-suscripcion">
            {opcionesVisibles.map((sector) => {
              const seleccionado = sectorIds.includes(sector.id)
              return <label key={sector.id} className={seleccionado ? 'seleccionado' : ''}>
                <input type="checkbox" checked={seleccionado} onChange={(event) => setSectorIds((actual) => event.target.checked ? [...actual, sector.id] : actual.filter((id) => id !== sector.id))} />
                <span>{sector.nombre}</span><i aria-hidden="true">{seleccionado && <Check size={14} />}</i>
              </label>
            })}
            {opciones.length > 0 && opcionesVisibles.length === 0 && <p className="mensaje-campo">No encontramos un barrio con ese nombre.</p>}
          </div>
        </fieldset>
      </div>
      {opciones.length === 0 && <p className="mensaje-campo">Los barrios estarán disponibles cuando el servidor termine de cargarlos.</p>}
      {error && <p className="mensaje-error" role="alert">{error.detalle}</p>}
      <div className="suscripcion-confirmacion"><div><span className="paso-numero">Paso 3</span><strong>Confirma tus avisos</strong><small>{correo && sectorIds.length ? 'Todo listo para enviar.' : 'Completa el correo y elige al menos un barrio.'}</small></div><button className="boton boton-primario" type="submit" disabled={mutacion.isPending || sectorIds.length === 0 || !correo.trim()}>{mutacion.isPending ? <><span className="spinner" /> Enviando…</> : 'Enviar confirmación'}</button></div>
    </form>
  )
}
