import { useMemo, useRef, useState } from 'react'
import type { FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, DropletOff, Gauge, LocateFixed } from 'lucide-react'
import { normalizarErrorApi } from '../api/client'
import { crearReporte } from '../api/services'
import type { SolicitudReporte } from '../api/services'
import type { Sector } from '../types/tipos-dominio'
import { obtenerHuellaDispositivo } from '../utils/huellaDispositivo'

type TipoReporte = 'SIN_AGUA' | 'PRESION_BAJA' | 'SERVICIO_RESTABLECIDO'

interface Props {
  sectores: Sector[]
  sectorPreseleccionado?: string
  onReporteEnviado: () => void
}

const TIPOS: Array<{ valor: TipoReporte; etiqueta: string; detalle: string; Icono: typeof DropletOff }> = [
  { valor: 'SIN_AGUA', etiqueta: 'No tengo agua', detalle: 'El servicio está interrumpido.', Icono: DropletOff },
  { valor: 'PRESION_BAJA', etiqueta: 'Presión muy baja', detalle: 'El agua llega con poca fuerza.', Icono: Gauge },
  { valor: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el servicio', detalle: 'Confirma que el agua regresó.', Icono: CheckCircle2 },
]

function obtenerCoordenada(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu dispositivo no permite compartir la ubicación.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(coords),
      () => reject(new Error('No pudimos obtener tu ubicación. Puedes enviar el reporte sin compartirla.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

export const FormularioReporte: FC<Props> = ({ sectores, sectorPreseleccionado = '', onReporteEnviado }) => {
  const preseleccionValida = sectores.some((sector) => sector.id === sectorPreseleccionado)
  const [sectorId, setSectorId] = useState(preseleccionValida ? sectorPreseleccionado : '')
  const [compartirUbicacion, setCompartirUbicacion] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [preparando, setPreparando] = useState(false)
  const procesandoRef = useRef(false)
  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const mutacion = useMutation({
    mutationFn: crearReporte,
    onSuccess: onReporteEnviado,
    onSettled: () => { procesandoRef.current = false; setPreparando(false) },
  })
  const procesando = preparando || mutacion.isPending

  const enviar = async (tipo: TipoReporte) => {
    if (!sectorId || procesandoRef.current) return
    procesandoRef.current = true
    setPreparando(true)
    setErrorLocal(null)
    mutacion.reset()

    try {
      const huella = await obtenerHuellaDispositivo()
      const solicitud: SolicitudReporte = { sectorId, tipo, huella }
      if (compartirUbicacion) {
        const coordenada = await obtenerCoordenada()
        solicitud.coordenada = { latitud: coordenada.latitude, longitud: coordenada.longitude }
      }
      mutacion.mutate(solicitud)
    } catch (error) {
      procesandoRef.current = false
      setPreparando(false)
      setErrorLocal(error instanceof Error ? error.message : 'No pudimos preparar el reporte.')
    }
  }

  const errorApi = mutacion.error ? normalizarErrorApi(mutacion.error) : null
  const error = errorLocal || errorApi?.detalle

  return (
    <div className="formulario-reporte">
      <label htmlFor="sector-reporte">1. Selecciona tu barrio</label>
      <select
        id="sector-reporte"
        value={sectorId}
        onChange={(event) => { setSectorId(event.target.value); setErrorLocal(null); mutacion.reset() }}
      >
        <option value="">Elige un barrio</option>
        {opciones.map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
      </select>

      <fieldset disabled={!sectorId || procesando}>
        <legend>2. ¿Cómo está el servicio ahora?</legend>
        <div className="opciones-reporte">
          {TIPOS.map(({ valor, etiqueta, detalle, Icono }) => (
            <button key={valor} type="button" onClick={() => void enviar(valor)}>
              <Icono aria-hidden="true" />
              <span><strong>{etiqueta}</strong><small>{detalle}</small></span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="compartir-ubicacion">
        <input type="checkbox" checked={compartirUbicacion} onChange={(event) => setCompartirUbicacion(event.target.checked)} />
        <LocateFixed aria-hidden="true" />
        <span><strong>Compartir mi ubicación</strong><small>Opcional. Solo enviamos la coordenada de este reporte.</small></span>
      </label>

      {procesando && <p className="mensaje-campo" role="status">Enviando reporte…</p>}
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      <p className="privacidad-reporte">No necesitas registrarte. Usamos una huella anónima para limitar abusos, no para identificarte.</p>
    </div>
  )
}
