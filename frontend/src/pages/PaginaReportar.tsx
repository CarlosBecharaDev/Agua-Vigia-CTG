import { FuncionNoDisponible } from '../components/EstadoPagina'

export default function PaginaReportar() {
  return (
    <FuncionNoDisponible
      titulo="El envío de reportes aún no está habilitado"
      descripcion="Podrás elegir tu barrio manualmente o compartir tu ubicación de forma opcional cuando el backend publique el endpoint de reportes."
      detalle="No guardamos reportes localmente ni mostramos confirmaciones falsas."
    />
  )
}
