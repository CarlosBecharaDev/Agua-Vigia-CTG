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
              marginBottom: '0.5rem',
              borderBottom: `2px solid ${COLOR_POR_ESTADO[estado].claro}`,
              paddingBottom: '0.35rem',
            }}
          >
            <InsigniaEstado estado={estado} tamaño="sm" />
            <span
              className="uppercase-label"
              style={{ color: 'var(--color-tinta-2)' }}
            >
              {grupo.length} {grupo.length === 1 ? 'sector' : 'sectores'}
            </span>
          </div>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {grupo.map(sector => (
              <li
                key={sector.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--color-linea)',
                  gap: '0.5rem',
                }}
              >
                <button
                  onClick={() => onSectorSeleccionado?.(sector)}
                  aria-label={`Ver ${sector.nombre} en el mapa`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-tinta)',
                    fontFamily: 'var(--font-cuerpo)',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    padding: '0.25rem 0',
                    minHeight: '44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    flex: 1,
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
                      marginTop: '0.2rem',
                      fontFamily: 'var(--font-util)'
                    }}>
                      <MessageSquareWarning size={12} />
                      {obtenerReportesMock(sector)} reportes ciudadanos
                    </span>
                  )}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
