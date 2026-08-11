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
import { InsigniaEstado } from './InsigniaEstado'

interface Props {
  sectores: Sector[]
  cargando: boolean
  error: string | null
  onSectorSeleccionado?: (sector: Sector) => void
}

/** Skeleton de un ítem de la lista mientras carga */
const SkeletonItem: FC = () => (
  <li aria-hidden="true" className="lista-sectores-skel">
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

  return (
    <section aria-label="Lista de sectores y su estado de servicio">
      <h2 className="lista-sectores-titulo">Estado por sector</h2>

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
        <div key={estado} className="lista-sectores-grupo">
          <div className="lista-sectores-grupo-cab">
            <InsigniaEstado estado={estado} tamaño="sm" />
            <span className="uppercase-label cuenta">{grupo.length}</span>
          </div>

          <ul className="lista-sectores-items">
            {grupo.map(sector => (
              <li key={sector.id}>
                <button
                  onClick={() => onSectorSeleccionado?.(sector)}
                  aria-label={`Ver ${sector.nombre} en el mapa`}
                  className="lista-sectores-btn"
                >
                  <span>{sector.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
