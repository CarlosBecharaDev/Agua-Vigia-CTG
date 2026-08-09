import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { DropletOff, ArrowDownToLine, CheckCircle2, MapPin, MessageSquare, Mail, User } from 'lucide-react'
import { AguaVigiaAPI } from '../api/services'
import { geometriaContienePunto, normalizarNombreBarrio } from '../utils/geografia'


export type TipoReporte = 'SIN_AGUA' | 'PRESION_BAJA' | 'SERVICIO_RESTABLECIDO'

interface Props {
  sectores: {id: string, nombre: string}[]
  sectorPreseleccionado?: string
  onReporteEnviado: () => void
}

export const FormularioReporte: FC<Props> = ({ sectores, sectorPreseleccionado, onReporteEnviado }) => {
  const [sectorId, setSectorId] = useState<string>(() => sessionStorage.getItem('gps_sectorId') || sectorPreseleccionado || '')
  const [sectorNombreGPS, setSectorNombreGPS] = useState<string>(() => sessionStorage.getItem('gps_sectorNombre') || '')
  const [tipo, setTipo] = useState<TipoReporte | ''>('')
  const [compartirUbicacion, setCompartirUbicacion] = useState(() => sessionStorage.getItem('gps_verificado') === 'true')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para la sección opcional (Login/Comentarios/Suscripción)
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [quiereSuscribirse, setQuiereSuscribirse] = useState(true)
  const [comentario, setComentario] = useState('')

  // La URL puede resolverse después del primer render de PaginaReportar.
  // Sincronizar aquí evita perder el sector preseleccionado en ese caso.
  useEffect(() => {
    if (sectorPreseleccionado && !sectorId && !sessionStorage.getItem('gps_verificado')) {
      setSectorId(sectorPreseleccionado)
    }
  }, [sectorId, sectorPreseleccionado])

  // Verificación de ubicación GPS obligatoria (Anti-Fraude)
  const alternarUbicacion = () => {
    if (compartirUbicacion) return; // Si ya se detectó, no hacer nada

    if (!('geolocation' in navigator)) {
      setError('Tu dispositivo no soporta geolocalización. Es imposible verificar tu ubicación.')
      return
    }

    setCompartirUbicacion(true)
    setError(null)

    // Solicitamos acceso real al GPS del dispositivo
    navigator.geolocation.getCurrentPosition(
      async (_posicion) => {
        const userLat = _posicion.coords.latitude
        const userLng = _posicion.coords.longitude



        try {
          // Cargamos la cartografía REAL de Cartagena subida por tu equipo
          const res = await fetch('/barrios-cartagena.geojson')
          const geojson = await res.json()
          
          const featureEncontrado = geojson.features.find((feature: any) =>
            geometriaContienePunto(feature.geometry, userLat, userLng)
          )

          if (!featureEncontrado) {
            setCompartirUbicacion(false)
            setError('No pudimos ubicarte dentro de un barrio de Cartagena. Verifica tu ubicación e intenta de nuevo.')
            return
          }

          const nombreBarrio = featureEncontrado.properties.NOMBRE
          const idBarrio = `geo-${normalizarNombreBarrio(nombreBarrio)}`
          setSectorId(idBarrio)
          setSectorNombreGPS(nombreBarrio)
          sessionStorage.setItem('gps_sectorId', idBarrio)
          sessionStorage.setItem('gps_sectorNombre', nombreBarrio)
          sessionStorage.setItem('gps_verificado', 'true')
        } catch {
          setCompartirUbicacion(false)
          setError('No pudimos leer el mapa de barrios. Intenta de nuevo cuando tengas conexión.')
        }
      },
      (errorGPS) => {
        setCompartirUbicacion(false) // Deshacer el estado de carga
        sessionStorage.removeItem('gps_verificado')
        if (errorGPS.code === errorGPS.PERMISSION_DENIED) {
          setError('⚠️ Permiso GPS Denegado: Es OBLIGATORIO encender y compartir tu ubicación para validar que estás en la zona y evitar falsos reportes.')
        } else {
          setError('No pudimos establecer conexión con tu GPS. Intenta de nuevo.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }
  
  const alEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectorId || !tipo) {
      setError('Por favor, selecciona qué problema tienes y asegúrate de verificar tu ubicación GPS.')
      return
    }

    setEnviando(true)
    setError(null)

    try {
      // Llamada real al backend mediante la API centralizada
      await AguaVigiaAPI.enviarReporte({
        sectorId,
        tipo,
        comentario,
        ubicacionGPS: compartirUbicacion
      });
      
      onReporteEnviado()
    } catch (err) {
      console.warn('No se pudo enviar el reporte:', err)
      setError('No se pudo enviar el reporte. Intenta nuevamente cuando el servicio esté disponible.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={alEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Alerta de Errores */}
      {error && (
        <div style={{ backgroundColor: 'var(--color-estado-sin)', color: '#FFF', padding: '1rem', borderRadius: 'var(--radio-base)', fontSize: '0.9rem', fontWeight: '500', boxShadow: '0 4px 15px rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>{error}</div>
        </div>
      )}

      {/* 1. Selección de problema */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-tinta)' }}>
          ¿Cuál es el problema?
        </legend>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { valor: 'SIN_AGUA', etiqueta: 'No tengo agua', color: 'var(--color-estado-sin)', Icono: DropletOff },
            { valor: 'PRESION_BAJA', etiqueta: 'Presión muy baja', color: 'var(--color-estado-baja)', Icono: ArrowDownToLine },
            { valor: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el servicio', color: 'var(--color-estado-con)', Icono: CheckCircle2 }
          ].map((opcion) => {
            const Icono = opcion.Icono;
            return (
              <label 
                key={opcion.valor}
                className="hover-glowing"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  border: tipo === opcion.valor ? `2px solid ${opcion.color}` : '1px solid var(--color-linea)',
                  borderRadius: 'var(--radio-md)',
                  cursor: 'pointer',
                  backgroundColor: tipo === opcion.valor ? 'var(--color-superficie)' : 'transparent',
                  transition: 'all var(--transicion)'
                }}
              >
                <input
                  type="radio"
                  name="tipoReporte"
                  value={opcion.valor}
                  checked={tipo === opcion.valor}
                  onChange={(e) => setTipo(e.target.value as TipoReporte)}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: opcion.color }}
                />
                <Icono size={18} color={tipo === opcion.valor ? opcion.color : 'var(--color-tinta-2)'} />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-tinta)', fontWeight: tipo === opcion.valor ? '500' : '400' }}>
                  {opcion.etiqueta}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 2. Verificación de ubicación GPS (OBLIGATORIA) */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-tinta)' }}>
          Verificación de Ubicación
        </legend>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-tinta-2)', marginBottom: '1rem' }}>
          Para evitar falsos reportes, necesitamos validar que te encuentras físicamente en el barrio afectado.
        </p>

        <button
          type="button"
          onClick={alternarUbicacion}
          disabled={compartirUbicacion && !!sectorId}
          className={(!compartirUbicacion || !sectorId) ? "hover-glowing" : ""}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            width: '100%',
            backgroundColor: sectorId ? 'var(--color-superficie)' : 'transparent',
            borderRadius: 'var(--radio-md)',
            border: sectorId ? '2px solid var(--color-estado-con)' : '1px solid var(--color-acento)',
            cursor: (compartirUbicacion && !!sectorId) ? 'default' : 'pointer',
            textAlign: 'left',
            transition: 'all var(--transicion)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: sectorId ? 'var(--color-estado-con)' : 'var(--color-acento)',
              color: '#FFF',
              transition: 'all var(--transicion)'
            }}>
              {sectorId ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
            </div>
            <div>
              <span style={{ display: 'block', color: 'var(--color-tinta)', fontWeight: '600', fontSize: '0.95rem' }}>
                {sectorId 
                  ? `📍 Estás en: ${sectorNombreGPS || sectores.find(s => s.id === sectorId)?.nombre || 'Cartagena'}`
                  : compartirUbicacion ? 'Analizando cartografía GPS...' : 'Detectar mi barrio actual'}
              </span>
              <span style={{ display: 'block', color: 'var(--color-tinta-2)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                {sectorId ? 'Ubicación verificada con éxito' : 'Requerido para continuar'}
              </span>
            </div>
          </div>
        </button>
      </fieldset>

      {/* 4. Sección Opcional: Comentarios y Suscripción (Requiere Login) */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0, marginTop: '0.5rem' }}>
        <legend style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
          Detalles Adicionales (Opcional)
        </legend>
        
        {!estaAutenticado ? (
          <div style={{ backgroundColor: 'var(--color-superficie)', padding: '1rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-tinta-2)', marginBottom: '1rem' }}>
              Para dejar un comentario detallado o recibir alertas de tu barrio a tu correo, necesitas iniciar sesión.
            </p>
            <button
              type="button"
              onClick={() => setEstaAutenticado(true)}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-acento)',
                border: '1px solid var(--color-acento)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radio-pill)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <User size={16} /> Iniciar Sesión para Comentar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--color-superficie)', padding: '1.25rem', borderRadius: 'var(--radio-md)', border: '1px solid var(--color-linea)' }}>
            
            {/* Campo de comentario */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-tinta)' }}>
                <MessageSquare size={16} color="var(--color-tinta-2)" />
                Describe la situación:
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: El agua sale con tierra o está amarilla..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radio-base)',
                  border: '1px solid var(--color-linea)',
                  backgroundColor: 'var(--color-fondo)',
                  color: 'var(--color-tinta)',
                  minHeight: '80px',
                  fontFamily: 'var(--font-cuerpo)',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Checkbox Suscripción */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={quiereSuscribirse}
                onChange={(e) => setQuiereSuscribirse(e.target.checked)}
                style={{ marginTop: '0.2rem', width: '1rem', height: '1rem', accentColor: 'var(--color-acento)' }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--color-tinta)', fontWeight: '500' }}>
                  <Mail size={16} color="var(--color-tinta-2)" /> Suscribirme a este barrio
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-tinta-3)', marginTop: '0.2rem' }}>
                  Te enviaremos correos electrónicos cuando el estado del agua cambie en este sector.
                </span>
              </div>
            </label>
          </div>
        )}
      </fieldset>

      {error && (
        <div role="alert" style={{ color: 'var(--color-estado-sin)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={enviando || !tipo || !sectorId}
        style={{
          backgroundColor: (!tipo || !sectorId) ? 'var(--color-linea)' : 'var(--color-acento)',
          color: (!tipo || !sectorId) ? 'var(--color-tinta-3)' : '#FFFFFF',
          border: 'none',
          borderRadius: 'var(--radio-pill)',
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: '600',
          fontFamily: 'var(--font-cuerpo)',
          cursor: (!tipo || !sectorId || enviando) ? 'not-allowed' : 'pointer',
          marginTop: '0.5rem',
          transition: 'all var(--transicion)',
          boxShadow: (!tipo || !sectorId || enviando) ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
        }}
      >
        {enviando ? 'Enviando reporte...' : 'Enviar reporte'}
      </button>

    </form>
  )
}
