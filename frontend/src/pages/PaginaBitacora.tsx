import { EstadoProximamente } from '../components/EstadoPagina'

export default function PaginaBitacora() {
  return (
    <EstadoProximamente variante="bitacora"
      titulo="La bitácora pública está en preparación"
      descripcion="Esta sección se habilitará cuando exista el registro inmutable oficial en el backend."
      detalle="Los boletines externos no se presentan como una bitácora propia porque no garantizan trazabilidad append-only."
      items={['Trazabilidad de cada cambio', 'Fuente y momento de verificación', 'Historial público consultable']}
    />
  )
}
