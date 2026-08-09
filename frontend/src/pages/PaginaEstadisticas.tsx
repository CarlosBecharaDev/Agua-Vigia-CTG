import { EstadoProximamente } from '../components/EstadoPagina'

export default function PaginaEstadisticas() {
  return (
    <EstadoProximamente variante="datos"
      titulo="Las estadísticas todavía no están disponibles"
      descripcion="Publicaremos comparaciones de duración y cumplimiento cuando el backend entregue datos verificados mediante un contrato OpenAPI."
      detalle="No mostramos cifras calculadas en el navegador ni estimaciones de demostración."
      items={['Evolución del servicio', 'Duración de interrupciones', 'Cobertura por barrio', 'Histórico verificado']}
    />
  )
}
