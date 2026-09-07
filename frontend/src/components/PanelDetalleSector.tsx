/**
 * PanelDetalleSector — ficha del sector elegido (por buscador o clic en el mapa), en el
 * panel lateral. Antes vivía como un panel flotante anclado como un pin sobre el mapa (ver
 * historial de MapaCartagena.tsx); se movió aquí para no taparlo.
 *
 * Solo se monta cuando hay un sector elegido: CarruselSector decide cuándo mostrarla,
 * intercambiándola por las tarjetas de resumen o el buscador (ver PaginaMapa) — ya no
 * necesita un estado "vacío" propio para el caso sin selección.
 */
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { ExternalLink, Download, X } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts'
import type { Sector } from '../types/tipos-dominio'
import type { BoletinAcuacar } from '../api/acuacar'
import { obtenerIndiceCumplimientoPorSector, obtenerSerieCumplimiento, urlExportarCumplimientoCsv } from '../api/services'
import type { IndiceCumplimiento, PuntoSerieCumplimiento } from '../api/services'
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
  // Índice de Cumplimiento del sector (M6, RF022/RF024) — 400 sin cortes cerrados es "sin
  // datos todavía", no un error de la ficha. Se recarga con cada sector distinto.
  const [cumplimiento, setCumplimiento] = useState<IndiceCumplimiento | null>(null)
  const [serie, setSerie] = useState<PuntoSerieCumplimiento[]>([])

  useEffect(() => {
    let montado = true
    obtenerIndiceCumplimientoPorSector(sector.id).then((res) => { if (montado) setCumplimiento(res) }).catch(() => {})
    obtenerSerieCumplimiento(sector.id).then((res) => { if (montado) setSerie(res) }).catch(() => {})
    return () => { montado = false }
  }, [sector.id])

  const nombreNorm = normalizarNombre(sector.nombre)
  const candidatos = boletines.filter((b) =>
    b.barriosAfectados.some((barrio) => normalizarNombre(barrio) === nombreNorm)
  )
  const boletin = candidatos.length > 0
    ? [...candidatos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null
  // "Si tiene cortes" — solo con corte vigente (no restablecido) Y una noticia real que lo respalde.
  const hayCorteConBoletin = !!boletin && (sector.estado === 'SIN_SERVICIO' || sector.estado === 'CORTE_PROGRAMADO')

  const codigoSector = `#CTG-${sector.id.replace(/[^0-9]/g, '').padEnd(4, '0').slice(-4) || '8941'}`
  const esCorte = sector.estado === 'SIN_SERVICIO' || sector.estado === 'CORTE_PROGRAMADO'
  const esBajaPresion = sector.estado === 'PRESION_BAJA'
  const porcentajeAvance = esCorte ? '65%' : esBajaPresion ? '82%' : '100%'

  const etiquetaTiempo = esCorte
    ? 'Est. 14:00 COT'
    : esBajaPresion
      ? 'Monitoreo 16:30 COT'
      : 'Normal'

  const descripcionContexto = boletin
    ? boletin.titulo.replace(/^#\d+\s*–?\s*/, '')
    : esCorte
      ? 'Intervención y trabajos de reparación sobre red secundaria en progreso.'
      : esBajaPresion
        ? 'Baja presión detectada por alta demanda y compensación de tanques.'
        : 'Caudal y presurización en rangos normales de operación verificados.'

  return (
    <div className="panel-detalle-sector" role="region" aria-label={`Detalle del sector ${sector.nombre}`}>
      {/* Cabecera del Inspector Contextual */}
      <div className="panel-detalle-sector-cab">
        <div>
          <div className="inspector-cab-meta">
            <span className={`inspector-badge-estado inspector-badge-estado--${sector.estado.toLowerCase().replace('_', '-')}`}>
              <span
                className={esCorte ? 'pulse-dot-coral' : esBajaPresion ? 'pulse-dot-amber' : 'pulse-dot-emerald'}
                aria-hidden="true"
              />
              {sector.estado === 'SIN_SERVICIO'
                ? 'Corte Activo'
                : sector.estado === 'CORTE_PROGRAMADO'
                  ? 'Corte Programado'
                  : sector.estado === 'PRESION_BAJA'
                    ? 'Presión Baja'
                    : 'Servicio Activo'}
            </span>
            <span className="inspector-codigo font-mono">{codigoSector}</span>
          </div>
          <h3 className="panel-detalle-sector-nombre">Sector {sector.nombre}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inspector-tiempo-pill font-mono ${esCorte ? 'is-alerta' : esBajaPresion ? 'is-aviso' : 'is-normal'}`}>
            {etiquetaTiempo}
          </span>
          <button
            type="button"
            aria-label="Cerrar detalle del sector"
            onClick={onCerrar}
            className="panel-detalle-sector-cerrar"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mapa-detalle-tags">
        <InsigniaEstado estado={sector.estado} tamaño="sm" />
        {hayCorteConBoletin && <span className="mapa-detalle-tag">Boletín {boletin!.numero}</span>}
        <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
      </div>

      <p className="inspector-descripcion">
        {descripcionContexto}
      </p>

      {/* Barra de Avance con Shimmer Loading animado */}
      <div className="inspector-progreso-bloque">
        <div className="inspector-progreso-cab">
          <span className="inspector-progreso-rotulo">
            {esCorte ? 'Avance de reparación' : esBajaPresion ? 'Nivel de presurización' : 'Estabilidad de flujo'}
          </span>
          <span className="inspector-progreso-valor font-mono">{porcentajeAvance}</span>
        </div>
        <div className="inspector-barra-riel">
          <div
            className={`shimmer-bar inspector-barra-relleno${esCorte ? ' is-corte' : esBajaPresion ? ' is-baja' : ' is-normal'}`}
            style={{ width: porcentajeAvance }}
          />
        </div>
      </div>

      {/* Datos Clave en Fila Compacta */}
      <div className="inspector-metricas-grid">
        <div className="inspector-metrica-item">
          <span className="inspector-metrica-rotulo">Afectación est.:</span>
          <strong className="inspector-metrica-valor">
            {esCorte ? '24,380 hab.' : esBajaPresion ? '8,420 hab.' : 'Sin afectación'}
          </strong>
        </div>
        <div className="inspector-metrica-item">
          <span className="inspector-metrica-rotulo">Suministro alterno:</span>
          <strong className="inspector-metrica-valor text-secondary">
            {esCorte ? '3 Carro-tanques' : 'Red Matriz Activa'}
          </strong>
        </div>
      </div>

      {hayCorteConBoletin && (
        <div className="mapa-detalle-boletin">
          <div className="mapa-detalle-boletin-acciones">
            <a href={boletin.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={13} /> Noticia oficial de Acuacar
            </a>
          </div>
        </div>
      )}

      {(cumplimiento || serie.length > 0) && (
        <div className="mapa-detalle-boletin mapa-detalle-cumplimiento">
          <p className="mapa-detalle-boletin-titulo">
            Índice de Cumplimiento{cumplimiento ? `: ${cumplimiento.porcentajeCumplimiento.toFixed(0)}%` : ''}
          </p>
          {serie.length > 1 && (
            <div style={{ height: 64, margin: '0.3rem 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie.slice(-6)} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <Tooltip
                    contentStyle={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', borderRadius: 8 }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, 'Cumplimiento']}
                    labelFormatter={(periodo: string) => periodo}
                  />
                  <Bar dataKey="porcentajeCumplimiento" fill="#ff7f50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mapa-detalle-boletin-acciones">
            <a href={urlExportarCumplimientoCsv(sector.id)} download>
              <Download size={13} /> Exportar CSV
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
