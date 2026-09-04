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
    <div className="form-reporte-moderno">
      {/* Paso 1: Selección de Barrio */}
      <div className="form-reporte-bloque">
        <label htmlFor="sector-reporte" className="form-reporte-label">
          <span className="form-suscripcion-chip-paso">1</span>
          Selecciona tu barrio
        </label>
        <select
          id="sector-reporte"
          value={sectorId}
          onChange={(event) => { setSectorId(event.target.value); setErrorLocal(null); mutacion.reset() }}
          className="form-reporte-select"
        >
          <option value="">Elige un barrio de Cartagena…</option>
          {opciones.map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
        </select>
      </div>

      {/* Paso 2: Estado del Servicio */}
      <fieldset disabled={!sectorId || procesando} className="form-reporte-bloque" style={{ border: '1px solid rgba(255, 255, 255, 0.09)' }}>
        <legend className="form-reporte-label" style={{ padding: '0 0.5rem' }}>
          <span className="form-suscripcion-chip-paso">2</span>
          ¿Cómo está el servicio ahora?
        </legend>
        <div className="form-reporte-opciones-grid">
          {TIPOS.map(({ valor, etiqueta, detalle, Icono }) => {
            const claseColor = valor === 'SIN_AGUA' ? 'opcion-sin-agua' : valor === 'PRESION_BAJA' ? 'opcion-presion-baja' : 'opcion-restablecido'
            return (
              <button
                key={valor}
                type="button"
                onClick={() => void enviar(valor)}
                className={`form-reporte-opcion-btn ${claseColor}`}
              >
                <div className="form-reporte-opcion-icono">
                  <Icono size={20} aria-hidden="true" />
                </div>
                <div className="form-reporte-opcion-textos">
                  <strong>{etiqueta}</strong>
                  <small>{detalle}</small>
                </div>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Acciones Opcionales: Ubicación y Foto */}
      <div className="form-reporte-extras">
        <label className="form-reporte-extra-item">
          <input
            type="checkbox"
            checked={compartirUbicacion}
            onChange={(event) => setCompartirUbicacion(event.target.checked)}
          />
          <LocateFixed size={18} style={{ color: '#c084fc', flexShrink: 0 }} aria-hidden="true" />
          <div className="form-reporte-extra-textos">
            <strong>Compartir ubicación</strong>
            <small>Opcional (coordenada)</small>
          </div>
        </label>

        <label className="form-reporte-extra-item">
          <input
            type="file"
            accept={TIPOS_FOTO_ACEPTADOS.join(',')}
            onChange={(event) => {
              const rechazada = !elegirFoto(event.target.files?.[0] ?? null)
              if (rechazada) event.target.value = ''
            }}
          />
          <Camera size={18} style={{ color: '#f472b6', flexShrink: 0 }} aria-hidden="true" />
          <div className="form-reporte-extra-textos">
            <strong>Adjuntar una foto</strong>
            <small>{foto ? foto.name : 'Opcional (evidencia)'}</small>
          </div>
        </label>
      </div>

      {procesando && (
        <p style={{ color: '#d8b4fe', fontSize: '0.85rem', textAlign: 'center', margin: '0.2rem 0' }} role="status">
          <span className="spinner" /> Enviando reporte a la comunidad…
        </p>
      )}

      {error && (
        <div className="form-suscripcion-error-badge" role="alert">
          {error}
        </div>
      )}

      <p style={{ color: 'rgba(203, 213, 225, 0.6)', fontSize: '0.74rem', textAlign: 'center', margin: '0.2rem 0 0' }}>
        Tus reportes son 100% anónimos y ayudan a mantener informada a toda Cartagena.
      </p>
    </div>
  )
}
