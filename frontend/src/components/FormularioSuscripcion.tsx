import { useMemo, useState } from 'react'
import type { FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BellRing, CheckCircle2, LocateFixed, MailCheck, X } from 'lucide-react'
import { crearSuscripcion } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import type { Sector } from '../types/tipos-dominio'
import { Stepper } from './Stepper/Stepper'
import { BuscadorBarrios } from './BuscadorBarrios'
import {
  detectarBarrioPorCoordenada,
  emparejarSectorPorNombreBarrio,
  obtenerCoordenadaDelNavegador,
} from '../utils/detectarSectorPorUbicacion'

const TOTAL_PASOS = 4
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const FormularioSuscripcion: FC<{ sectores: Sector[] }> = ({ sectores }) => {
  const [pasoActivo, setPasoActivo] = useState(1)
  const [correo, setCorreo] = useState('')
  const [sectorIds, setSectorIds] = useState<string[]>([])
  const [detectando, setDetectando] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null)
  const [barrioDetectado, setBarrioDetectado] = useState<string | null>(null)
  const [busquedaBarrio, setBusquedaBarrio] = useState('')

  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const mutacion = useMutation({ mutationFn: crearSuscripcion })

  const alternarSector = (id: string, marcado: boolean) => {
    setSectorIds((actual) => (marcado ? [...actual, id] : actual.filter((existente) => existente !== id)))
  }

  const detectarUbicacion = async () => {
    setDetectando(true)
    setErrorUbicacion(null)
    setBarrioDetectado(null)
    try {
      const coordenada = await obtenerCoordenadaDelNavegador()
      const nombreBarrio = await detectarBarrioPorCoordenada(coordenada.latitude, coordenada.longitude)
      if (!nombreBarrio) throw new Error('No identificamos tu barrio dentro de Cartagena. Elígelo de la lista.')
      const sector = emparejarSectorPorNombreBarrio(opciones, nombreBarrio)
      if (!sector) throw new Error(`Detectamos "${nombreBarrio}", pero todavía no está en la lista. Elígelo manualmente.`)
      setSectorIds((actual) => (actual.includes(sector.id) ? actual : [...actual, sector.id]))
      setBarrioDetectado(sector.nombre)
    } catch (error) {
      setErrorUbicacion(error instanceof Error ? error.message : 'No pudimos detectar tu barrio.')
    } finally {
      setDetectando(false)
    }
  }

  const puedeAvanzar = [
    true,
    CORREO_VALIDO.test(correo.trim()),
    sectorIds.length > 0,
    true,
  ][pasoActivo - 1]

  const avanzar = () => {
    if (pasoActivo === TOTAL_PASOS) {
      mutacion.mutate({ correo: correo.trim(), sectorIds })
      return
    }
    setPasoActivo((actual) => Math.min(TOTAL_PASOS, actual + 1))
  }

  const retroceder = () => setPasoActivo((actual) => Math.max(1, actual - 1))

  if (mutacion.isSuccess) {
    return (
      <div className="suscripcion-exito" role="status">
        <CheckCircle2 aria-hidden="true" />
        <div><strong>Revisa tu correo</strong><p>Te enviamos un enlace para confirmar los avisos de tus barrios.</p></div>
      </div>
    )
  }

  const error = mutacion.error ? normalizarErrorApi(mutacion.error).detalle : null
  const nombresSeleccionados = opciones.filter((sector) => sectorIds.includes(sector.id)).map((sector) => sector.nombre)

  return (
    <Stepper
      pasoActivo={pasoActivo}
      totalPasos={TOTAL_PASOS}
      puedeAvanzar={Boolean(puedeAvanzar)}
      enviando={mutacion.isPending}
      onAtras={retroceder}
      onSiguiente={avanzar}
      textoFinalizar="Enviar confirmación"
    >
      <div className="paso-suscripcion paso-suscripcion-intro">
        <BellRing aria-hidden="true" />
        <h3>Recibe avisos de tus barrios</h3>
        <p>Te escribimos solo cuando cambie el estado del servicio en los barrios que elijas: corte, presión baja o
          restablecimiento. Nada de spam — un correo por cambio real, y puedes cancelar cuando quieras.</p>
      </div>

      <div className="paso-suscripcion">
        <label htmlFor="correo-suscripcion">Tu correo electrónico</label>
        <input
          id="correo-suscripcion"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
          placeholder="vecino@correo.com"
        />
        <p className="mensaje-campo">Solo lo usamos para enviarte el enlace de confirmación y tus avisos.</p>
      </div>

      <div className="paso-suscripcion">
        <button type="button" className="boton-ubicacion-automatica" onClick={() => void detectarUbicacion()} disabled={detectando}>
          <LocateFixed aria-hidden="true" />
          <span>{detectando ? 'Detectando tu barrio…' : 'Usar mi ubicación automáticamente'}</span>
        </button>
        {barrioDetectado && <p className="mensaje-campo">Detectamos que estás en <strong>{barrioDetectado}</strong> y lo agregamos abajo.</p>}
        {errorUbicacion && <p className="mensaje-error" role="alert">{errorUbicacion}</p>}

        <p className="paso-suscripcion-subtitulo">O agrega barrios manualmente</p>
        <BuscadorBarrios
          sectores={opciones}
          busqueda={busquedaBarrio}
          onCambiarBusqueda={setBusquedaBarrio}
          cargando={false}
          error={null}
          seleccionMultiple
          sectorIdsSeleccionados={sectorIds}
          onSectorSeleccionado={(sector) => alternarSector(sector.id, !sectorIds.includes(sector.id))}
        />

        {sectorIds.length > 0 && (
          <ul className="chips-barrios-suscripcion" aria-label="Barrios elegidos">
            {opciones.filter((sector) => sectorIds.includes(sector.id)).map((sector) => (
              <li key={sector.id}>
                <span className="chips-barrios-suscripcion-nombre" title={sector.nombre}>{sector.nombre}</span>
                <button type="button" onClick={() => alternarSector(sector.id, false)} aria-label={`Quitar ${sector.nombre}`}>
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {opciones.length === 0 && <p className="mensaje-campo">Los barrios estarán disponibles cuando el servidor termine de cargarlos.</p>}
      </div>

      <div className="paso-suscripcion paso-suscripcion-revision">
        <MailCheck aria-hidden="true" />
        <h3>Revisa antes de enviar</h3>
        <dl>
          <dt>Correo</dt>
          <dd>{correo.trim() || '—'}</dd>
          <dt>Barrios</dt>
          <dd>{nombresSeleccionados.length > 0 ? nombresSeleccionados.join(', ') : '—'}</dd>
        </dl>
        {error && <p className="mensaje-error" role="alert">{error}</p>}
      </div>
    </Stepper>
  )
}
