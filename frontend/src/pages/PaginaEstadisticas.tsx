import { useQuery } from '@tanstack/react-query'
import { PageWrapper } from '../components/PageWrapper'
import { BarChart3, Clock, AlertTriangle, CalendarDays } from 'lucide-react'
import { obtenerEstadisticas } from '../api/services'
import './PaginaEstadisticas.css'

export default function PaginaEstadisticas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['estadisticas'],
    queryFn: obtenerEstadisticas,
  })

  if (isLoading) return <PageWrapper><div className="estadisticas-cargando">Cargando métricas...</div></PageWrapper>
  if (error || !data) return <PageWrapper><div className="mensaje-error">Error cargando estadísticas.</div></PageWrapper>

  const diasSemanales = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const cortesPorDia = diasSemanales.map(dia => ({
    dia,
    cortes: data.cortesPorDiaDeSemana[dia] || 0
  }))
  const maxCortesDia = Math.max(...cortesPorDia.map(d => d.cortes), 1)

  return (
    <PageWrapper>
      <main id="contenido-principal" className="pagina-estadisticas" aria-labelledby="titulo-estadisticas">
        <header className="estadisticas-cabecera">
          <div className="estadisticas-contexto">
            <span className="estado-pagina-icono"><BarChart3 /></span>
            <p className="eyebrow">Transparencia Pública</p>
            <h1 id="titulo-estadisticas">Estadísticas de Servicio</h1>
            <p>Métricas calculadas en tiempo real a partir de reportes ciudadanos y anuncios oficiales.</p>
          </div>
        </header>

        <div className="metricas-grid">
          <article className="metrica-tarjeta principal">
            <header>
              <Clock className="metrica-icono" />
              <h3>Duración Promedio</h3>
            </header>
            <div className="metrica-valor">
              <strong>{data.duracionPromedioHoras}</strong>
              <span>horas por corte</span>
            </div>
            <p className="metrica-nota">Tiempo promedio de resolución de cortes cerrados.</p>
          </article>

          <article className="metrica-tarjeta">
            <header>
              <AlertTriangle className="metrica-icono warning" />
              <h3>Barrios Más Afectados</h3>
            </header>
            <ul className="lista-barrios-afectados">
              {data.sectoresMasAfectados.length === 0 && <li>No hay cortes registrados.</li>}
              {data.sectoresMasAfectados.map((sector) => (
                <li key={sector.sectorId}>
                  <div className="barrio-info">
                    <span className="barrio-nombre">{sector.nombre}</span>
                    <span className="barrio-conteo">{sector.cantidadCortes} cortes</span>
                  </div>
                  <div className="barra-progreso-bg">
                    <div 
                      className="barra-progreso-fill" 
                      style={{ width: `${(sector.cantidadCortes / Math.max(data.sectoresMasAfectados[0].cantidadCortes, 1)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="metrica-tarjeta">
            <header>
              <CalendarDays className="metrica-icono info" />
              <h3>Cortes por Día</h3>
            </header>
            <div className="grafico-barras">
              {cortesPorDia.map(({ dia, cortes }) => (
                <div key={dia} className="barra-dia" title={`${dia}: ${cortes} cortes`}>
                  <div className="barra-dia-fill" style={{ height: `${(cortes / maxCortesDia) * 100}%` }}>
                    <span className="barra-etiqueta-valor">{cortes}</span>
                  </div>
                  <span className="barra-etiqueta">{dia.substring(0, 3)}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </main>
    </PageWrapper>
  )
}
