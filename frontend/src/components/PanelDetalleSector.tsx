/**
 * PanelDetalleSector — ficha del sector elegido (por buscador o clic en el mapa), en el
 * panel lateral. Antes vivía como un panel flotante anclado como un pin sobre el mapa (ver
 * historial de MapaCartagena.tsx); se movió aquí para no taparlo.
 *
 * Solo se monta cuando hay un sector elegido: CarruselSector decide cuándo mostrarla,
 * intercambiándola por las tarjetas de resumen o el buscador (ver PaginaMapa) — ya no
 * necesita un estado "vacío" propio para el caso sin selección.
 */
import type { FC } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'
import type { BoletinAcuacar } from '../api/acuacar'
import { EtiquetaFrescura } from './EtiquetaFrescura'
import { InsigniaEstado } from './InsigniaEstado'

interface Props {
  sector: Sector
  boletines: BoletinAcuacar[]
  onCerrar: () => void
  onAbrirReporte: (sectorId: string) => void
}

function normalizarNombre(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export const PanelDetalleSector: FC<Props> = ({ sector, boletines, onCerrar, onAbrirReporte }) => {
  const nombreNorm = normalizarNombre(sector.nombre)
  const candidatos = boletines.filter((b) =>
    b.barriosAfectados.some((barrio) => normalizarNombre(barrio) === nombreNorm)
  )
  const boletin = candidatos.length > 0
    ? [...candidatos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null
  // "Si tiene cortes" — solo con corte vigente (no restablecido) Y una noticia real que lo respalde.
  const hayCorteConBoletin = !!boletin && (sector.estado === 'SIN_SERVICIO' || sector.estado === 'CORTE_PROGRAMADO')

  return (
    <div className="panel-detalle-sector" role="region" aria-label={`Detalle del sector ${sector.nombre}`}>
      <div className="panel-detalle-sector-cab">
        <p className="panel-detalle-sector-nombre">{sector.nombre}</p>
        <button
          type="button"
          aria-label="Cerrar detalle del sector"
          onClick={onCerrar}
          className="panel-detalle-sector-cerrar"
        >
          ✕
        </button>
      </div>

      <div className="mapa-detalle-tags">
        <InsigniaEstado estado={sector.estado} tamaño="sm" />
        {hayCorteConBoletin && <span className="mapa-detalle-tag">Boletín {boletin!.numero}</span>}
        <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
      </div>

      {hayCorteConBoletin && (
        <div className="mapa-detalle-boletin">
          <p className="mapa-detalle-boletin-titulo">
            {boletin.titulo.replace(/^#\d+\s*–?\s*/, '')}
          </p>
          <div className="mapa-detalle-boletin-acciones">
            <a href={boletin.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} /> Noticia oficial de Acuacar
            </a>
          </div>
        </div>
      )}

      <button type="button" onClick={() => onAbrirReporte(sector.id)} className="mapa-detalle-reportar">
        Reportar problema en este sector →
      </button>
    </div>
  )
}
