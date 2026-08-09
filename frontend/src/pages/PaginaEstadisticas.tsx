import { FuncionNoDisponible } from '../components/EstadoPagina'

export default function PaginaEstadisticas() {
  return (
    <FuncionNoDisponible
      titulo="Las estadísticas todavía no están disponibles"
      descripcion="Publicaremos comparaciones de duración y cumplimiento cuando el backend entregue datos verificados mediante un contrato OpenAPI."
      detalle="No mostramos cifras calculadas en el navegador ni estimaciones de demostración."
    />
  )
}
