import { useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { Download, ExternalLink, Info, X } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Sector } from '../types/tipos-dominio'
import type { EventoBitacora, IndiceCumplimiento, PuntoSerieCumplimiento } from '../api/services'
import { obtenerIndiceCumplimientoPorSector, obtenerSerieCumplimiento, urlExportarCumplimientoCsv } from '../api/services'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { InsigniaEstado } from './InsigniaEstado'

interface Props {
  sector: Sector
  boletines: EventoBitacora[]
  onCerrar: () => void
  onAbrirReporte: (sectorId: string) => void
}

function nombreFuente(url: string | null | undefined): string {
  if (!url) return 'Fuente registrada'
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'acuacar.com' ? 'Acuacar' : host
  } catch {
    return 'Fuente registrada'
  }
}

export const PanelDetalleSector: FC<Props> = ({ sector, boletines, onCerrar, onAbrirReporte }) => {
  const [cumplimiento, setCumplimiento] = useState<IndiceCumplimiento | null>(null)
  const [serie, setSerie] = useState<PuntoSerieCumplimiento[]>([])
  const existeEnApi = !sector.id.startsWith('geo-')

  useEffect(() => {
    setCumplimiento(null)
    setSerie([])
    if (!existeEnApi) return
    let montado = true
    obtenerIndiceCumplimientoPorSector(sector.id)
      .then((resultado) => { if (montado) setCumplimiento(resultado) })
      .catch(() => {})
    obtenerSerieCumplimiento(sector.id)
      .then((resultado) => { if (montado) setSerie(resultado) })
      .catch(() => {})
    return () => { montado = false }
  }, [existeEnApi, sector.id])

  const eventoReciente = useMemo(() => boletines
    .filter((evento) => evento.sectorId === sector.id)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0] ?? null,
  [boletines, sector.id])

  return (
    <div className="panel-detalle-sector" role="region" aria-label={`Detalle del sector ${sector.nombre}`}>
      <div className="panel-detalle-sector-cab">
        <div>
          <div className="inspector-cab-meta">
            <InsigniaEstado estado={sector.estado} tamaño="sm" />
            <span className="inspector-codigo font-mono">{sector.id}</span>
          </div>
          <h3 className="panel-detalle-sector-nombre">{sector.nombre}</h3>
        </div>
        <button type="button" aria-label="Cerrar detalle del sector" onClick={onCerrar}
          className="panel-detalle-sector-cerrar">
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="mapa-detalle-tags">
        <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
      </div>

      {eventoReciente ? (
        <div className="mapa-detalle-boletin">
          <p className="mapa-detalle-boletin-titulo">Evento publicado en los últimos 30 días</p>
          <p className="inspector-descripcion">{eventoReciente.descripcion}</p>
          <time dateTime={eventoReciente.timestamp} className="font-mono">
            {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(eventoReciente.timestamp))}
          </time>
          {eventoReciente.urlOriginal && (
            <div className="mapa-detalle-boletin-acciones">
              <a href={eventoReciente.urlOriginal} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={13} aria-hidden="true" /> Abrir fuente original · {nombreFuente(eventoReciente.urlOriginal)}
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mapa-detalle-boletin" role="status">
          <p className="mapa-detalle-boletin-titulo"><Info size={14} aria-hidden="true" /> Sin eventos recientes publicados</p>
          <p className="inspector-descripcion">No encontramos avisos verificados para este barrio dentro de los últimos 30 días.</p>
        </div>
      )}

      {(cumplimiento || serie.length > 0) && (
        <div className="mapa-detalle-boletin mapa-detalle-cumplimiento">
          <p className="mapa-detalle-boletin-titulo">
            Índice de Cumplimiento{cumplimiento ? `: ${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : ''}
          </p>
          {serie.length > 1 && (
            <div className="mapa-detalle-grafica">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie.slice(-6)} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip formatter={(valor: number) => [`${valor.toFixed(0)}%`, 'Cumplimiento']} />
                  <Bar dataKey="porcentajeCumplimiento" fill="var(--color-acento)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mapa-detalle-boletin-acciones">
            <a href={urlExportarCumplimientoCsv(sector.id)} download>
              <Download size={13} aria-hidden="true" /> Exportar datos del sector
            </a>
          </div>
        </div>
      )}

      {existeEnApi ? (
        <button type="button" onClick={() => onAbrirReporte(sector.id)} className="mapa-detalle-reportar">
          Reportar problema en este sector →
        </button>
      ) : (
        <p className="inspector-descripcion" role="status">
          Este barrio está en la cartografía, pero aún no tiene identificador publicado por la API; no se habilita un reporte inválido.
        </p>
      )}
    </div>
  )
}
