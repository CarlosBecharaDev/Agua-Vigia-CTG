/**
 * ListaSectores — alternativa textual accesible al mapa (RF004).
 *
 * DESIGN.md §6: "El mapa necesita alternativa no visual: una lista de sectores
 * con su estado en texto. Un mapa sin lista es inaccesible para lector de pantalla."
 *
 * Esta lista es navegable por teclado y sirve como contenido principal cuando
 * el mapa no carga (red lenta, JS desactivado, lector de pantalla).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FC } from 'react'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'
import { InsigniaEstado } from './InsigniaEstado'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { Check, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  sectores: Sector[]
  cargando: boolean
  error: string | null
  sectorActivo?: Sector | null
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

export const ListaSectores: FC<Props> = ({ sectores, cargando, error, sectorActivo, onSectorSeleccionado }) => {
  const mostrarAdvertencia = Boolean(error && sectores.length > 0)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'novedades' | 'con-servicio'>('todos')
  const buscadorRef = useRef<HTMLInputElement>(null)
  const sectoresMonitoreados = useMemo(() => sectores.filter((sector) => sector.estado !== null), [sectores])
  const sectoresFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    return sectoresMonitoreados.filter((sector) => {
      const coincideNombre = !termino || sector.nombre.toLocaleLowerCase('es').includes(termino)
      const coincideFiltro = filtro === 'todos'
        || (filtro === 'con-servicio' && sector.estado === 'CON_SERVICIO')
        || (filtro === 'novedades' && sector.estado !== 'CON_SERVICIO')
      return coincideNombre && coincideFiltro
    })
  }, [busqueda, filtro, sectoresMonitoreados])

  useEffect(() => {
    const enfocarBusqueda = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const objetivo = event.target as HTMLElement
      if (objetivo.matches('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      buscadorRef.current?.focus()
    }
    document.addEventListener('keydown', enfocarBusqueda)
    return () => document.removeEventListener('keydown', enfocarBusqueda)
  }, [])
  // Agrupar por estado para que sea más escaneable
  const sinServicio   = sectoresFiltrados.filter(s => s.estado === 'SIN_SERVICIO')
  const programados   = sectoresFiltrados.filter(s => s.estado === 'CORTE_PROGRAMADO')
  const presionBaja   = sectoresFiltrados.filter(s => s.estado === 'PRESION_BAJA')
  const conServicio   = sectoresFiltrados.filter(s => s.estado === 'CON_SERVICIO')

  const grupos = [
    { sectores: sinServicio,   estado: 'SIN_SERVICIO'     as const },
    { sectores: programados,   estado: 'CORTE_PROGRAMADO' as const },
    { sectores: presionBaja,   estado: 'PRESION_BAJA'     as const },
    { sectores: conServicio,   estado: 'CON_SERVICIO'     as const },
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
          ref={buscadorRef}
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar un barrio…"
          autoComplete="off"
          onKeyDown={(event) => { if (event.key === 'Escape') setBusqueda('') }}
        />
        {!busqueda && <kbd aria-label="Atajo de teclado: diagonal">/</kbd>}
        {busqueda && <><small aria-live="polite">{sectoresFiltrados.length}</small><button type="button" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}><X size={15} /></button></>}
      </label>

      <div className="filtros-barrios" aria-label="Filtrar barrios por estado">
        <button type="button" className={filtro === 'todos' ? 'activo' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos <span>{sectoresMonitoreados.length}</span></button>
        <button type="button" className={filtro === 'novedades' ? 'activo' : ''} aria-pressed={filtro === 'novedades'} onClick={() => setFiltro('novedades')}>Novedades <span>{sectoresMonitoreados.filter((sector) => sector.estado !== 'CON_SERVICIO').length}</span></button>
        <button type="button" className={filtro === 'con-servicio' ? 'activo' : ''} aria-pressed={filtro === 'con-servicio'} onClick={() => setFiltro('con-servicio')}>Con agua <span>{sectoresMonitoreados.filter((sector) => sector.estado === 'CON_SERVICIO').length}</span></button>
      </div>

      <p className="resultado-barrios" aria-live="polite">{sectoresFiltrados.length} {sectoresFiltrados.length === 1 ? 'barrio visible' : 'barrios visibles'}</p>

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

      {!cargando && sectoresMonitoreados.length === 0 && (
        <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.875rem' }}>
          Todavía no hay barrios con estado reportado o corte programado. Puedes{' '}
          <Link to="/reportar">consultar cuándo estará disponible el reporte</Link>.
        </p>
      )}

      {!cargando && sectoresMonitoreados.length > 0 && sectoresFiltrados.length === 0 && (
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
              <li key={sector.id} className={`sector-item${sectorActivo?.id === sector.id ? ' seleccionado' : ''}`}>
                <button
                  onClick={() => onSectorSeleccionado?.(sector)}
                  aria-label={`Ver ${sector.nombre} en el mapa`}
                  aria-pressed={sectorActivo?.id === sector.id}
                  className="sector-boton"
                >
                  <span className="sector-seleccion"><i aria-hidden="true" />{sector.nombre}</span>
                  {sectorActivo?.id === sector.id && <Check size={16} aria-hidden="true" />}
                </button>
                <div className="sector-frescura">
                  <InsigniaEstado estado={sector.estado} tamaño="sm" />
                  {sector.actualizadoEn && <EtiquetaFrescura timestampIso={sector.actualizadoEn} />}
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
