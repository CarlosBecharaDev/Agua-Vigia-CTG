/**
 * ListaSectores — alternativa textual accesible al mapa (RF004).
 *
 * DESIGN.md §6: "El mapa necesita alternativa no visual: una lista de sectores
 * con su estado en texto. Un mapa sin lista es inaccesible para lector de pantalla."
 *
 * Esta lista es navegable por teclado y sirve como contenido principal cuando
 * el mapa no carga (red lenta, JS desactivado, lector de pantalla).
 */
import type { FC } from 'react'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'
import { InsigniaEstado } from './InsigniaEstado'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { MessageSquareWarning } from 'lucide-react'

interface Props {
  sectores: Sector[]
  cargando: boolean
  error: string | null
  onSectorSeleccionado?: (sector: Sector) => void
}

/** Skeleton de un ítem de la lista mientras carga */
const SkeletonItem: FC = () => (
  <li
    aria-hidden="true"
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--color-linea)',
    }}
  >
    <div className="skeleton" style={{ width: '140px', height: '16px' }} />
    <div className="skeleton" style={{ width: '80px', height: '16px' }} />
  </li>
)

export const ListaSectores: FC<Props> = ({ sectores, cargando, error, onSectorSeleccionado }) => {
  // Agrupar por estado para que sea más escaneable
  const sinServicio   = sectores.filter(s => s.estado === 'SIN_SERVICIO')
  const programados   = sectores.filter(s => s.estado === 'CORTE_PROGRAMADO')
  const presionBaja   = sectores.filter(s => s.estado === 'PRESION_BAJA')
  const conServicio   = sectores.filter(s => s.estado === 'CON_SERVICIO')

  const grupos = [
    { sectores: sinServicio,   estado: 'SIN_SERVICIO'     as const },
    { sectores: programados,   estado: 'CORTE_PROGRAMADO' as const },
    { sectores: presionBaja,   estado: 'PRESION_BAJA'     as const },
    { sectores: conServicio,   estado: 'CON_SERVICIO'     as const },
  ].filter(g => g.sectores.length > 0)

  if (error) {
    return (
      <p role="alert" style={{ color: 'var(--color-estado-sin)', padding: '1rem 0', fontSize: '0.875rem' }}>
        No pudimos cargar los sectores. Revisa tu conexión e intenta de nuevo.
      </p>
    )
  }

  // Genera un número de reportes estático falso para diseño
  const obtenerReportesMock = (sector: Sector) => {
    if (sector.estado === 'CON_SERVICIO') return 0;
    if (sector.estado === 'CORTE_PROGRAMADO') return Math.floor(parseInt(sector.id) * 2);
    return parseInt(sector.id) * 4 + 7;
  }

  return (
    <section aria-label="Lista de sectores y su estado de servicio">
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          marginBottom: '0.75rem',
          color: 'var(--color-tinta)',
        }}
      >
        Estado por sector
      </h2>

      {cargando && (
        <ul style={{ listStyle: 'none', padding: 0 }} aria-label="Cargando sectores">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)}
        </ul>
      )}

      {!cargando && sectores.length === 0 && (
        <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.875rem' }}>
          Todavía no hay sectores registrados. Sé el primero en{' '}
          <a href="/reportar" style={{ color: 'var(--color-acento)' }}>reportar un problema</a>.
        </p>
      )}

      {!cargando && grupos.map(({ sectores: grupo, estado }) => (
        <div key={estado} style={{ marginBottom: '1.25rem' }}>
          {/* Cabecera del grupo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <InsigniaEstado estado={estado} tamaño="sm" />
            <span
              className="uppercase-label"
              style={{ color: 'var(--color-tinta-2)', fontWeight: 'bold' }}
            >
              {grupo.length}
            </span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {grupo.map(sector => (
              <li key={sector.id}>
                <button
                  onClick={() => onSectorSeleccionado?.(sector)}
                  aria-label={`Ver ${sector.nombre} en el mapa`}
                  className="hover-glowing"
                  style={{
                    background: 'var(--color-superficie)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-tinta)',
                    fontFamily: 'var(--font-cuerpo)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    padding: '0.75rem 1rem',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    borderRadius: '1rem',
                    transition: 'all var(--transicion)'
                  }}
                >
                  <span>{sector.nombre}</span>
                  {obtenerReportesMock(sector) > 0 && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--color-estado-sin)', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      fontFamily: 'var(--font-util)',
                      backgroundColor: 'var(--color-superficie)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      <MessageSquareWarning size={12} />
                      {obtenerReportesMock(sector)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
