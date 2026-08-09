import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Megaphone, MessageCircleMore, Newspaper, ShieldCheck, X } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'
import { normalizarErrorApi } from '../api/client'
import { registrarReporteCiudadano } from '../api/services'
import type { TipoReporte } from '../api/services'
import { InsigniaEstado } from './InsigniaEstado'
import { EtiquetaFrescura } from './EtiquetaFrescura'

interface Props {
  sector: Sector
  onCerrar: () => void
  integrado?: boolean
}

const OPCIONES: Array<{ tipo: TipoReporte; etiqueta: string }> = [
  { tipo: 'SIN_AGUA', etiqueta: 'Estoy sin agua' },
  { tipo: 'PRESION_BAJA', etiqueta: 'Tengo baja presión' },
  { tipo: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el agua' },
]

export function PanelSectorSeleccionado({ sector, onCerrar, integrado = false }: Props) {
  const [vista, setVista] = useState<'acciones' | 'fuente' | 'reportes' | 'reportar'>('acciones')
  const queryClient = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (tipo: TipoReporte) => registrarReporteCiudadano(sector.id, tipo),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['sectores'] }) },
  })
  const reiniciarMutacion = mutacion.reset

  useEffect(() => {
    setVista('acciones')
    reiniciarMutacion()
  }, [sector.id, reiniciarMutacion])

  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return (
    <section role="region" aria-label={`Acciones para el sector ${sector.nombre}`} className={integrado ? 'panel-sector-integrado' : 'mapa-detalle'}>
      <div className="mapa-detalle-cabecera">
        <div><span className="uppercase-label">Sector seleccionado</span><h3>{sector.nombre}</h3><InsigniaEstado estado={sector.estado} /></div>
        <button aria-label="Cerrar detalle del sector" onClick={onCerrar}><X size={18} /></button>
      </div>

      <div className="acciones-sector" aria-label="Acciones disponibles para este barrio">
        <button type="button" className={vista === 'fuente' ? 'activo' : ''} onClick={() => setVista('fuente')}><Newspaper size={16} /><span>Fuente</span></button>
        <button type="button" className={vista === 'reportes' ? 'activo' : ''} onClick={() => setVista('reportes')}><MessageCircleMore size={16} /><span>Reportes</span></button>
        <button type="button" className={`accion-reportar${vista === 'reportar' ? ' activo' : ''}`} onClick={() => setVista('reportar')}><Megaphone size={16} /><span>Reportar</span></button>
      </div>

      <div className="contenido-accion-sector" aria-live="polite">
        {vista === 'acciones' && <p>Consulta la evidencia disponible o comparte lo que ocurre en tu barrio.</p>}
        {vista === 'fuente' && <div className="detalle-fuente"><ShieldCheck size={18} /><div><strong>Estado entregado por AguaVigía</strong><p>El detalle de la fuente externa todavía no forma parte de la respuesta pública.</p>{sector.actualizadoEn && <EtiquetaFrescura timestampIso={sector.actualizadoEn} />}</div></div>}
        {vista === 'reportes' && <div className="detalle-pendiente"><MessageCircleMore size={18} /><div><strong>Consulta pública en preparación</strong><p>El sistema recibe reportes, pero aún no publica el listado por barrio. No mostramos cifras sin respaldo.</p></div></div>}
        {vista === 'reportar' && !mutacion.isSuccess && <div className="opciones-reporte"><p>¿Qué está pasando ahora?</p><div>{OPCIONES.map((opcion) => <button type="button" key={opcion.tipo} disabled={mutacion.isPending} onClick={() => mutacion.mutate(opcion.tipo)}>{mutacion.isPending && mutacion.variables === opcion.tipo ? <span className="spinner" /> : null}{opcion.etiqueta}</button>)}</div>{error && <p className="mensaje-error" role="alert">{error.detalle}</p>}<small>Sin cuenta. Usamos una huella anónima para evitar reportes repetidos.</small></div>}
        {mutacion.isSuccess && <div className="reporte-confirmado" role="status"><CheckCircle2 size={19} /><div><strong>Reporte recibido</strong><p>Gracias. El estado se actualizará cuando alcance el consenso requerido.</p></div></div>}
      </div>
    </section>
  )
}
