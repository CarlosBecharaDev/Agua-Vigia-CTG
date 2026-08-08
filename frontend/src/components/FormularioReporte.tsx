import { useState } from 'react'
import type { FC } from 'react'
import { DropletOff, ArrowDownToLine, CheckCircle2, MapPin, MessageSquare, Mail, User } from 'lucide-react'

// TODO: Reemplazar con datos de la API cuando C2 abra
const SECTORES_MOCK = [
  { id: '1', nombre: 'BOCAGRANDE' },
  { id: '2', nombre: 'CASTILLOGRANDE' },
  { id: '3', nombre: 'EL LAGUITO' },
  { id: '4', nombre: 'MANGA' },
  { id: '5', nombre: 'PIE DE LA POPA' },
  { id: '6', nombre: 'OLAYA ST. RICAURTE' },
  { id: '7', nombre: 'OLAYA ST. CENTRAL' },
  { id: '8', nombre: 'GETSEMANI' },
  { id: '9', nombre: 'EL CENTRO' },
  { id: '10', nombre: 'LA BOQUILLA' },
]

export type TipoReporte = 'SIN_AGUA' | 'PRESION_BAJA' | 'SERVICIO_RESTABLECIDO'

interface Props {
  sectorPreseleccionado?: string
  onReporteEnviado: () => void
}

export const FormularioReporte: FC<Props> = ({ sectorPreseleccionado, onReporteEnviado }) => {
  const [sectorId, setSectorId] = useState<string>(sectorPreseleccionado || '')
  const [tipo, setTipo] = useState<TipoReporte | ''>('')
  const [compartirUbicacion, setCompartirUbicacion] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para la sección opcional (Login/Comentarios/Suscripción)
  const [estaAutenticado, setEstaAutenticado] = useState(false)
  const [quiereSuscribirse, setQuiereSuscribirse] = useState(true)
  const [comentario, setComentario] = useState('')

  // Simulación de detección automática de barrio por GPS
  const alternarUbicacion = () => {
    if (compartirUbicacion) return; // Si ya se detectó, no hacer nada

    setCompartirUbicacion(true)
    // Simular retraso de señal GPS y búsqueda de polígono
    setTimeout(() => {
      // Si venía de la URL con un sector, validamos que coincide.
      // Para esta demo, simplemente asignamos el sector preseleccionado si existe,
      // o '8' (Getsemaní) si entró sin preselección.
      setSectorId(sectorPreseleccionado || '8') 
    }, 1200)
  }
  
  const alEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectorId || !tipo) {
      setError('Por favor, selecciona tu sector y qué problema tienes.')
      return
    }

    setEnviando(true)
    setError(null)

    try {
      // TODO: Aquí irá el fetch a POST /api/reportes cuando C2 abra.
      // Incluiremos la huella del dispositivo generada/leída desde localStorage.
      
      // Simulamos latencia de red para demostrar UI de carga
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Simular éxito
      onReporteEnviado()
    } catch (err) {
      setError('Hubo un problema al enviar el reporte. Por favor, intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={alEnviar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
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
                  ? `📍 Estás en: ${SECTORES_MOCK.find(s => s.id === sectorId)?.nombre}`
                  : compartirUbicacion ? 'Obteniendo coordenadas GPS...' : 'Detectar mi barrio actual'}
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
