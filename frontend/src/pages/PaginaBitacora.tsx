import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, History, RefreshCw } from 'lucide-react'
import { normalizarErrorApi } from '../api/client'
import { obtenerBitacora } from '../api/services'
import { PageWrapper } from '../components/PageWrapper'
import './DatosPublicos.css'

const etiquetas: Record<string, string> = {
  CORTE_ANUNCIADO: 'Corte anunciado',
  CORTE_CONFIRMADO_POR_CIUDADANOS: 'Confirmado por la comunidad',
  CORTE_RESTABLECIDO: 'Servicio restablecido',
}

export default function PaginaBitacora() {
  const consulta = useQuery({ queryKey: ['bitacora'], queryFn: obtenerBitacora })
  return <PageWrapper><main id="contenido-principal" className="pagina-datos-publicos">
    <header className="cabecera-datos"><div><p className="eyebrow">Registro público · solo anexado</p><h1>Bitácora del agua</h1><p>Cada anuncio, confirmación ciudadana y restablecimiento queda registrado en orden cronológico.</p></div><History aria-hidden="true" /></header>
    {consulta.isPending && <div className="estado-datos" role="status">Consultando eventos verificados…</div>}
    {consulta.isError && <div className="estado-datos" role="alert"><div><strong>No pudimos cargar la bitácora</strong><p>{normalizarErrorApi(consulta.error).detalle}</p></div><button className="boton boton-secundario" onClick={() => consulta.refetch()}><RefreshCw size={16} /> Reintentar</button></div>}
    {consulta.data?.length === 0 && <div className="estado-datos" role="status">Todavía no hay eventos registrados.</div>}
    {consulta.data && consulta.data.length > 0 && <ol className="linea-tiempo">
      {consulta.data.map((evento) => <li key={evento.id}><span className="punto-evento"><CheckCircle2 aria-hidden="true" /></span><article>
        <div className="evento-cabecera"><strong>{etiquetas[evento.tipo] ?? evento.tipo.replaceAll('_', ' ')}</strong><time dateTime={evento.timestamp}>{new Date(evento.timestamp).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</time></div>
        {evento.descripcion && <p>{evento.descripcion}</p>}
        <div className="evento-referencias">{evento.sectorId && <span>Sector: {evento.sectorId}</span>}{evento.corteId && <span>Corte: {evento.corteId}</span>}</div>
      </article></li>)}
    </ol>}
    <p className="nota-datos">La interfaz solo lee este historial; no puede editar ni borrar sus eventos.</p>
  </main></PageWrapper>
}
