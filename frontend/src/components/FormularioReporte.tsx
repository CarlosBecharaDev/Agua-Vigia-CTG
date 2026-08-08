import { useState } from 'react'
import type { FC } from 'react'

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

  // RF008: Máximo 2 toques desde el mapa. Si venimos con sector preseleccionado y tipo seleccionado, 
  // es muy rápido enviar el reporte.
  
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
            { valor: 'SIN_AGUA', etiqueta: '💧 No tengo agua', color: 'var(--color-estado-sin)' },
            { valor: 'PRESION_BAJA', etiqueta: '🚰 Presión muy baja', color: 'var(--color-estado-baja)' },
            { valor: 'SERVICIO_RESTABLECIDO', etiqueta: '✅ Ya volvió el servicio', color: 'var(--color-estado-con)' }
          ].map((opcion) => (
            <label 
              key={opcion.valor}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
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
              <span style={{ fontSize: '1rem', color: 'var(--color-tinta)', fontWeight: tipo === opcion.valor ? '500' : '400' }}>
                {opcion.etiqueta}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. Selección de sector */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontFamily: 'var(--font-display)', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
          ¿En qué barrio estás?
        </legend>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          aria-label="Seleccionar barrio"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            borderRadius: 'var(--radio-md)',
            border: '1px solid var(--color-linea)',
            backgroundColor: 'var(--color-superficie)',
            color: 'var(--color-tinta)',
            fontFamily: 'var(--font-cuerpo)'
          }}
        >
          <option value="" disabled>Selecciona tu sector...</option>
          {SECTORES_MOCK.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </fieldset>

      {/* 3. Permiso de ubicación (RF007) */}
      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem',
        backgroundColor: 'var(--color-superficie)',
        borderRadius: 'var(--radio-md)',
        border: '1px solid var(--color-linea)'
      }}>
        <input
          type="checkbox"
          checked={compartirUbicacion}
          onChange={(e) => setCompartirUbicacion(e.target.checked)}
          style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.1rem', accentColor: 'var(--color-acento)' }}
        />
        <div>
          <span style={{ display: 'block', color: 'var(--color-tinta)', fontWeight: '500', fontSize: '0.9rem' }}>
            Usar mi ubicación GPS
          </span>
          <span style={{ display: 'block', color: 'var(--color-tinta-2)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Ayuda a localizar fallas precisas. Solo se usa para este reporte.
          </span>
        </div>
      </label>

      {error && (
        <div role="alert" style={{ color: 'var(--color-estado-sin)', fontSize: '0.875rem' }}>
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
          borderRadius: 'var(--radio-md)',
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: '600',
          fontFamily: 'var(--font-cuerpo)',
          cursor: (!tipo || !sectorId || enviando) ? 'not-allowed' : 'pointer',
          marginTop: '0.5rem',
          transition: 'background-color var(--transicion)'
        }}
      >
        {enviando ? 'Enviando reporte...' : 'Enviar reporte'}
      </button>

    </form>
  )
}
