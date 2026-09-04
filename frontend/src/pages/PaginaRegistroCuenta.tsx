import { UserPlus } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { TarjetaCuenta } from '../components/TarjetaCuenta'
import { FormularioSolicitarCuenta } from '../components/FormularioSolicitarCuenta'

/**
 * La ruta suelta se conserva para quien llegue por enlace directo o marcador. La entrada normal es
 * el modal de la portada, que monta este mismo formulario sin sacar a nadie de la página.
 */
export default function PaginaRegistroCuenta() {
  return (
    <PageWrapper>
      <TarjetaCuenta
        icono={UserPlus}
        antetitulo="Veeduría ciudadana"
        titulo="Solicitar una cuenta"
        descripcion="Confirma tu correo y un administrador revisará tu solicitud."
      >
        <FormularioSolicitarCuenta />
      </TarjetaCuenta>
    </PageWrapper>
  )
}
