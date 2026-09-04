import { RotateCcwKey } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { TarjetaCuenta } from '../components/TarjetaCuenta'
import { FormularioOlvideClave } from '../components/FormularioOlvideClave'

/**
 * La ruta suelta se conserva para quien llegue por enlace directo o marcador. La entrada normal es
 * el modal de la portada, que monta este mismo formulario sin sacar a nadie de la página.
 */
export default function PaginaOlvideClave() {
  return (
    <PageWrapper>
      <TarjetaCuenta
        icono={RotateCcwKey}
        antetitulo="Panel del veedor"
        titulo="Restablecer la clave"
        descripcion="Te enviamos un enlace de un solo uso, válido 30 minutos."
      >
        <FormularioOlvideClave />
      </TarjetaCuenta>
    </PageWrapper>
  )
}
