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
        <AltaSegundoFactor obligatorio onCancelar={cerrar} />
      </PageWrapper>
    )
  }

  if (autenticado) {
    return (
      <PageWrapper>
        <PanelVeedor onCerrarSesion={cerrar} />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado cuenta-pagina">
        <section className="modal-reporte-contenedor cuenta-tarjeta" aria-labelledby="titulo-veedor">
          <div className="modal-reporte-fondo-animado" aria-hidden="true">
            <div className="orbe-rep-1" />
            <div className="orbe-rep-2" />
          </div>

          <div className="modal-reporte-cabecera" style={{ marginBottom: '1.25rem' }}>
            <div className="modal-reporte-icono-titulo">
              <div
                className="modal-reporte-badge-icono"
                style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}
                aria-hidden="true"
              >
                <ShieldCheck size={26} />
              </div>
              <div className="modal-reporte-titulos">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: '#c084fc',
                    fontSize: '0.72rem',
                    fontWeight: 750,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.2rem',
                  }}
                >
                  <LockKeyhole size={12} /> Acceso restringido
                </div>
                <h1 id="titulo-veedor" style={{ fontSize: '1.45rem', margin: 0, color: '#ffffff' }}>
                  Ingreso del Veedor
                </h1>
                <p>Centro de moderación oficial y control operativo.</p>
              </div>
            </div>
          </div>

          <FormularioIngreso onIngreso={() => setAviso(null)} avisoInicial={aviso} />
        </section>
      </main>
    </PageWrapper>
  )
}
