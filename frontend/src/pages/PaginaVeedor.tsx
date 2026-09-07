import { useEffect, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { cerrarSesionVeedor } from '../api/services'
import { sesionVeedor } from '../api/client'
import { useSesionVeedor } from '../hooks/useSesionVeedor'
import { PageWrapper } from '../components/PageWrapper'
import { PanelVeedor } from '../components/PanelVeedor'
import { FormularioIngreso } from '../components/FormularioIngreso'
import { AltaSegundoFactor } from '../components/AltaSegundoFactor'
import '../components/ModalReporte.css'
import '../components/Cuentas.css'

export default function PaginaVeedor() {
  const { autenticado, debeCompletarSegundoFactor } = useSesionVeedor()
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(
    () =>
      sesionVeedor.alCambiar(() => {
        if (!sesionVeedor.obtener()) setAviso('La sesión venció. Inicia sesión de nuevo.')
      }),
    [],
  )

  const cerrar = () => {
    void cerrarSesionVeedor()
    setAviso(null)
  }

  /**
   * Un ADMIN sin segundo factor entra con una sesión que no abre nada más. Mandarlo aquí no es una
   * cortesía: es la única pantalla que su token le permite usar, y el backend rechazaría el resto.
   */
  if (autenticado && debeCompletarSegundoFactor) {
    return (
      <PageWrapper>
        <main id="contenido-principal" tabIndex={-1}>
          <AltaSegundoFactor obligatorio onCancelar={cerrar} />
        </main>
      </PageWrapper>
    )
  }

  if (autenticado) {
    return (
      <PageWrapper>
        <main id="contenido-principal" tabIndex={-1}>
          <PanelVeedor onCerrarSesion={cerrar} />
        </main>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado cuenta-pagina">
        <section className="modal-reporte-contenedor cuenta-tarjeta cuenta-tarjeta-ingreso" aria-labelledby="titulo-veedor">
          <div className="modal-reporte-cabecera cuenta-cabecera-ingreso">
            <div className="modal-reporte-icono-titulo">
              <div className="modal-reporte-badge-icono" aria-hidden="true">
                <ShieldCheck size={26} />
              </div>
              <div className="modal-reporte-titulos">
                <div className="cuenta-acceso-restringido">
                  <LockKeyhole size={12} /> Acceso restringido
                </div>
                <h1 id="titulo-veedor">
                  Ingreso del veedor
                </h1>
                <p>Moderación de reportes y seguimiento operativo.</p>
              </div>
            </div>
          </div>

          <FormularioIngreso onIngreso={() => setAviso(null)} avisoInicial={aviso} />
        </section>
      </main>
    </PageWrapper>
  )
}
