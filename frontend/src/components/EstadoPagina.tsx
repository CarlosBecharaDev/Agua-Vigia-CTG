import type { FC, ReactNode } from 'react'
import { Construction, DatabaseZap, RefreshCw } from 'lucide-react'
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

export const ErrorRecurso: FC<{ mensaje: string; onReintentar: () => void }> = ({ mensaje, onReintentar }) => (
  <div className="estado-recurso" role="alert">
    <DatabaseZap aria-hidden="true" />
    <div><strong>No pudimos actualizar los barrios</strong><p>{mensaje}</p></div>
    <button type="button" className="boton boton-secundario" onClick={onReintentar}>
      <RefreshCw size={16} /> Reintentar
    </button>
  </div>
)
