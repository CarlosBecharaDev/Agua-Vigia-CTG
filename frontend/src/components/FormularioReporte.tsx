import { useMemo, useRef, useState } from 'react'
import type { FC } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Camera, DropletOff, Gauge, LocateFixed } from 'lucide-react'
import { normalizarErrorApi } from '../api/client'
import { agregarEvidenciaReporte, crearReporte } from '../api/services'
import type { ReporteRespuesta, SolicitudReporte } from '../api/services'
import type { Sector } from '../types/tipos-dominio'
import { obtenerHuellaDispositivo } from '../utils/huellaDispositivo'

const TAMANO_MAXIMO_FOTO = 10 * 1024 * 1024
const TIPOS_FOTO_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp']

type TipoReporte = 'SIN_AGUA' | 'PRESION_BAJA' | 'SERVICIO_RESTABLECIDO'

interface Props {
  sectores: Sector[]
  sectorPreseleccionado?: string
  /** `avisoFoto` viene con un mensaje cuando el reporte sí se guardó pero la evidencia
   *  fotográfica no se pudo subir (F6) — antes se tragaba en silencio y el usuario nunca se
   *  enteraba de que la foto no llegó. */
  onReporteEnviado: (reporte: ReporteRespuesta, avisoFoto?: string) => void
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
  const [foto, setFoto] = useState<File | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)
  const [preparando, setPreparando] = useState(false)
  const procesandoRef = useRef(false)
  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const mutacion = useMutation({
    mutationFn: async ({ solicitud, foto }: { solicitud: SolicitudReporte; foto: File | null }) => {
      const reporte = await crearReporte(solicitud)
      if (!foto) return { reporte, avisoFoto: undefined }
      // F6 — el reporte en sí ya quedó registrado (evidencia es un añadido opcional); pero antes,
      // si la subida fallaba, el `catch` vacío lo trataba igual que un éxito y el usuario nunca se
      // enteraba de que la foto no llegó, contra DESIGN.md §5 ("los errores explican qué pasó").
      // También cubre F6b: `reporte.id` es opcional en el contrato (schema.ts) — si el backend
      // alguna vez respondiera sin id, esto lo trata como fallo explícito en vez de un
      // `POST /reportes/undefined/foto` silencioso.
      if (!reporte.id) {
        return { reporte, avisoFoto: 'Reporte enviado, pero no pudimos adjuntar la foto. Intenta de nuevo desde el enlace de confirmación que puedes compartir con tus vecinos.' }
      }
      try {
        const reporteConFoto = await agregarEvidenciaReporte(reporte.id, foto)
        return { reporte: reporteConFoto, avisoFoto: undefined }
      } catch {
        return { reporte, avisoFoto: 'Reporte enviado, pero la foto no se pudo subir. Revisa tu conexión e inténtalo de nuevo más tarde.' }
      }
    },
    onSuccess: ({ reporte, avisoFoto }) => onReporteEnviado(reporte, avisoFoto),
    onSettled: () => { procesandoRef.current = false; setPreparando(false) },
  })
  const procesando = preparando || mutacion.isPending

  /** Devuelve false cuando el archivo se rechazó, para que quien llama pueda limpiar el input (F9). */
  const elegirFoto = (archivo: File | null): boolean => {
    if (!archivo) { setFoto(null); return true }
    if (!TIPOS_FOTO_ACEPTADOS.includes(archivo.type)) {
      setErrorLocal('La foto debe ser JPG, PNG o WebP.')
      return false
    }
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      setErrorLocal('La foto no puede pesar más de 10 MB.')
      return false
    }
    setErrorLocal(null)
    setFoto(archivo)
    return true
  }

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
      mutacion.mutate({ solicitud, foto })
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

      <label className="adjuntar-foto">
        <input
          type="file"
          accept={TIPOS_FOTO_ACEPTADOS.join(',')}
          onChange={(event) => {
            const rechazada = !elegirFoto(event.target.files?.[0] ?? null)
            // F9 — sin esto, reintentar con el mismo archivo rechazado no disparaba onChange
            // (mismo `value`) y no pasaba nada visible.
            if (rechazada) event.target.value = ''
          }}
        />
        <Camera aria-hidden="true" />
        <span><strong>Adjuntar una foto</strong><small>{foto ? foto.name : 'Opcional. Ayuda al veedor a verificar el reporte.'}</small></span>
      </label>

      {procesando && <p className="mensaje-campo" role="status">Enviando reporte…</p>}
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      <p className="privacidad-reporte">No necesitas registrarte. Usamos una huella anónima para limitar abusos, no para identificarte.</p>
    </div>
  )
}
