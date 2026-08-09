import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Clock3, Gauge, RefreshCw } from 'lucide-react'
import { normalizarErrorApi } from '../api/client'
import { obtenerCumplimientoGlobal, obtenerCumplimientoSector, obtenerSectores } from '../api/services'
import type { IndiceCumplimiento } from '../api/services'
import { PageWrapper } from '../components/PageWrapper'
import './DatosPublicos.css'

const duracion = (segundos: number) => {
  const horas = Math.floor(Math.abs(segundos) / 3600)
  const minutos = Math.round((Math.abs(segundos) % 3600) / 60)
  return `${segundos < 0 ? '−' : ''}${horas} h ${minutos} min`
}

function ResumenIndice({ indice, titulo }: { indice: IndiceCumplimiento; titulo: string }) {
  const porcentaje = Math.max(0, Math.min(100, indice.porcentajeCumplimiento))
  return (
    <section className="tarjeta-indice" aria-labelledby="titulo-indice">
      <div className="tarjeta-indice-cabecera"><div><p className="eyebrow">Datos verificados</p><h2 id="titulo-indice">{titulo}</h2></div><Gauge aria-hidden="true" /></div>
      <strong className="indice-valor">{porcentaje.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%</strong>
      <div className="barra-indice" role="progressbar" aria-label="Cumplimiento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje}><span style={{ width: `${porcentaje}%` }} /></div>
      <dl className="metricas-indice">
        <div><dt>Tiempo prometido</dt><dd>{duracion(indice.duracionPrometidaSegundos)}</dd></div>
        <div><dt>Tiempo real</dt><dd>{duracion(indice.duracionRealSegundos)}</dd></div>
        <div><dt>Desviación</dt><dd>{duracion(indice.desviacionSegundos)}</dd></div>
      </dl>
    </section>
  )
}

export default function PaginaEstadisticas() {
  const [sectorId, setSectorId] = useState('')
  const global = useQuery({ queryKey: ['cumplimiento', 'global'], queryFn: obtenerCumplimientoGlobal })
  const sectores = useQuery({ queryKey: ['sectores'], queryFn: obtenerSectores })
  const porSector = useQuery({ queryKey: ['cumplimiento', 'sector', sectorId], queryFn: () => obtenerCumplimientoSector(sectorId), enabled: Boolean(sectorId) })
  const indice = sectorId ? porSector.data : global.data
  const consulta = sectorId ? porSector : global
  const nombreSector = sectores.data?.sectores.find((sector) => sector.id === sectorId)?.nombre

  return <PageWrapper><main id="contenido-principal" className="pagina-datos-publicos">
    <header className="cabecera-datos"><div><p className="eyebrow">Transparencia del servicio</p><h1>Índice de cumplimiento</h1><p>Comparamos la duración prometida de los cortes oficiales con la duración que realmente tuvieron.</p></div><BarChart3 aria-hidden="true" /></header>
    <label className="filtro-datos" htmlFor="sector-estadisticas">Ámbito del indicador
      <select id="sector-estadisticas" value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
        <option value="">Toda Cartagena</option>
        {sectores.data?.sectores.map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}
      </select>
    </label>
    {consulta.isPending && <div className="estado-datos" role="status"><Clock3 /> Calculando con cortes cerrados…</div>}
    {consulta.isError && <div className="estado-datos" role="alert"><div><strong>Aún no hay un índice disponible</strong><p>{normalizarErrorApi(consulta.error).detalle}</p></div><button className="boton boton-secundario" onClick={() => consulta.refetch()}><RefreshCw size={16} /> Reintentar</button></div>}
    {indice && <ResumenIndice indice={indice} titulo={nombreSector ?? 'Resultado global de Cartagena'} />}
    <p className="nota-datos">El porcentaje nunca se infiere en el navegador: llega calculado por el backend a partir de cortes oficiales cerrados.</p>
  </main></PageWrapper>
}
