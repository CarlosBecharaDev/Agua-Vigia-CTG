import type { FC, ReactNode } from 'react'
import { BarChart3, BookOpenText, Check, Construction, DatabaseZap, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageWrapper } from './PageWrapper'

interface Props {
  titulo: string
  descripcion: string
  detalle?: string
  accion?: ReactNode
}

export const FuncionNoDisponible: FC<Props> = ({ titulo, descripcion, detalle, accion }) => (
  <PageWrapper>
    <main id="contenido-principal" className="pagina-estado">
      <section className="estado-pagina" aria-labelledby="titulo-estado">
        <span className="estado-pagina-icono" aria-hidden="true"><Construction /></span>
        <p className="eyebrow">Integración pendiente</p>
        <h1 id="titulo-estado">{titulo}</h1>
        <p>{descripcion}</p>
        {detalle && <small>{detalle}</small>}
        <div className="estado-pagina-acciones">
          {accion}
          <Link className="boton boton-secundario" to="/">Volver al mapa</Link>
        </div>
      </section>
    </main>
  </PageWrapper>
)

interface ProximamenteProps extends Props {
  variante: 'datos' | 'bitacora'
  items: string[]
}

export const EstadoProximamente: FC<ProximamenteProps> = ({ variante, titulo, descripcion, detalle, items }) => {
  const Icono = variante === 'datos' ? BarChart3 : BookOpenText
  return (
    <PageWrapper>
      <main id="contenido-principal" className="pagina-estado pagina-proximamente">
        <section className="proximamente-contenido" aria-labelledby="titulo-estado">
          <div className="proximamente-copy">
            <span className="estado-pagina-icono" aria-hidden="true"><Icono /></span>
            <p className="eyebrow">Integración en progreso</p>
            <h1 id="titulo-estado">{titulo}</h1>
            <p>{descripcion}</p>
            <ul className="lista-capacidades">{items.map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
            {detalle && <small className="nota-integridad">{detalle}</small>}
            <Link className="boton boton-primario" to="/">Explorar el mapa</Link>
          </div>
          <div className={`proximamente-visual visual-${variante}`} aria-label={variante === 'datos' ? 'Vista previa conceptual de futuras gráficas, sin cifras reales' : 'Vista previa conceptual de una futura línea de tiempo, sin eventos reales'}>
            <span className="preview-label">Vista previa de interfaz</span>
            {variante === 'datos' ? (
              <><div className="grafica-placeholder"><i /><i /><i /><i /><i /><i /></div><div className="grafica-lineas"><span /><span /><span /></div><p>Los espacios se activarán con datos verificados.</p></>
            ) : (
              <ol className="timeline-placeholder"><li><i /><div><strong>Reporte recibido</strong><span>Registro de entrada</span></div></li><li><i /><div><strong>Estado verificado</strong><span>Validación y fuente</span></div></li><li><i /><div><strong>Servicio restablecido</strong><span>Cierre trazable</span></div></li></ol>
            )}
          </div>
        </section>
      </main>
    </PageWrapper>
  )
}

export const ErrorRecurso: FC<{ mensaje: string; onReintentar: () => void }> = ({ mensaje, onReintentar }) => (
  <div className="estado-recurso" role="alert">
    <DatabaseZap aria-hidden="true" />
    <div><strong>No pudimos actualizar los barrios</strong><p>{mensaje}</p></div>
    <button type="button" className="boton boton-secundario" onClick={onReintentar}>
      <RefreshCw size={16} /> Reintentar
    </button>
  </div>
)
