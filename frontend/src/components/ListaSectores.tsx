/**
 * ListaSectores — alternativa textual accesible al mapa (RF004).
 *
 * DESIGN.md §6: "El mapa necesita alternativa no visual: una lista de sectores
 * con su estado en texto. Un mapa sin lista es inaccesible para lector de pantalla."
 *
 * Esta lista es navegable por teclado y sirve como contenido principal cuando
 * el mapa no carga (red lenta, JS desactivado, lector de pantalla).
 */
import { useMemo, useState } from 'react'
import type { FC } from 'react'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { InsigniaEstado } from './InsigniaEstado'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  const mostrarAdvertencia = Boolean(error && sectores.length > 0)
  const [busqueda, setBusqueda] = useState('')
  const sectoresFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    if (!termino) return sectores
    return sectores.filter((sector) => sector.nombre.toLocaleLowerCase('es').includes(termino))
  }, [busqueda, sectores])
  // Agrupar por estado para que sea más escaneable
  const sinServicio   = sectoresFiltrados.filter(s => s.estado === 'SIN_SERVICIO')
  const programados   = sectoresFiltrados.filter(s => s.estado === 'CORTE_PROGRAMADO')
  const presionBaja   = sectoresFiltrados.filter(s => s.estado === 'PRESION_BAJA')
  const conServicio   = sectoresFiltrados.filter(s => s.estado === 'CON_SERVICIO')
  const sinDatos      = sectoresFiltrados.filter(s => s.estado === null)

  const grupos = [
    { sectores: sinServicio,   estado: 'SIN_SERVICIO'     as const },
    { sectores: programados,   estado: 'CORTE_PROGRAMADO' as const },
    { sectores: presionBaja,   estado: 'PRESION_BAJA'     as const },
    { sectores: conServicio,   estado: 'CON_SERVICIO'     as const },
    { sectores: sinDatos,      estado: null },
  ].filter(g => g.sectores.length > 0)

  if (error && sectores.length === 0) {
    return (
      <p role="alert" className="mensaje-error">
        No pudimos cargar los sectores. Revisa tu conexión e intenta de nuevo.
      </p>
    )
  }

  return (
    <section className="lista-sectores" aria-label="Lista de sectores y su estado de servicio">
      <label className="buscador-barrios">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Buscar barrio</span>
        <input
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar un barrio…"
          autoComplete="off"
        />
        {busqueda && <small>{sectoresFiltrados.length}</small>}
      </label>

      {mostrarAdvertencia && (
        <div
          role="status"
          style={{
            color: 'var(--color-tinta-2)',
            background: 'rgba(255, 159, 10, 0.1)',
            border: '1px solid rgba(255, 159, 10, 0.25)',
            borderRadius: 'var(--radio-base)',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          Conexión no disponible. Se muestran los últimos datos que se cargaron; pueden estar desactualizados.
        </div>
      )}

      {cargando && (
        <ul style={{ listStyle: 'none', padding: 0 }} aria-label="Cargando sectores">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)}
        </ul>
      )}

      {!cargando && sectores.length === 0 && (
        <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.875rem' }}>
          Todavía no hay sectores registrados. Puedes{' '}
          <Link to="/reportar">consultar cuándo estará disponible el reporte</Link>.
        </p>
      )}

      {!cargando && sectores.length > 0 && sectoresFiltrados.length === 0 && (
        <div className="sin-resultados">
          <Search size={24} />
          <p>No encontramos “{busqueda}”. Prueba con otro nombre.</p>
          <button type="button" onClick={() => setBusqueda('')}>Limpiar búsqueda</button>
        </div>
      )}

      {!cargando && grupos.map(({ sectores: grupo, estado }) => {
        const color = estado ? COLOR_POR_ESTADO[estado].claro : COLOR_SIN_DATOS.claro;
        return (
        <div key={estado || 'sin-datos'} className="grupo-estado">
          {/* Cabecera del grupo */}
          <div
            className="grupo-estado-cabecera"
            style={{ '--grupo-color': color } as React.CSSProperties}
          >
            <InsigniaEstado estado={estado} tamaño="sm" />
            <span
              className="uppercase-label"
              style={{ color: 'var(--color-tinta-2)' }}
            >
              {grupo.length} {grupo.length === 1 ? 'sector' : 'sectores'}
            </span>
          </div>

          <ul className="sector-lista">
            {grupo.map(sector => (
              <li
                key={sector.id}
                className="sector-item"
              >
                <button
                  onClick={() => onSectorSeleccionado?.(sector)}
                  aria-label={`Ver ${sector.nombre} en el mapa`}
                  className="sector-boton"
                >
                  <span>{sector.nombre}</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                  <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        );
      })}
    </section>
  )
}
