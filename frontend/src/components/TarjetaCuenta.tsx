import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import './ModalReporte.css'
import './Cuentas.css'

interface Props {
  icono: LucideIcon
  antetitulo: string
  titulo: string
  descripcion: string
  children: ReactNode
}

/** El marco compartido por las cinco pantallas de cuentas, para que ninguna se desvíe sola. */
export function TarjetaCuenta({ icono: Icono, antetitulo, titulo, descripcion, children }: Props) {
  const idTitulo = 'titulo-' + titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <main id="contenido-principal" tabIndex={-1} className="pagina-estado cuenta-pagina">
      <section className="modal-reporte-contenedor cuenta-tarjeta" aria-labelledby={idTitulo}>
        <div className="modal-reporte-fondo-animado" aria-hidden="true">
          <div className="orbe-rep-1" />
          <div className="orbe-rep-2" />
        </div>

        <div className="modal-reporte-cabecera" style={{ marginBottom: '1.15rem' }}>
          <div className="modal-reporte-icono-titulo">
            <div
              className="modal-reporte-badge-icono"
              style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}
              aria-hidden="true"
            >
              <Icono size={26} />
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
                {antetitulo}
              </div>
              <h1 id={idTitulo} style={{ fontSize: '1.4rem', margin: 0, color: '#ffffff' }}>
                {titulo}
              </h1>
              <p>{descripcion}</p>
            </div>
          </div>
        </div>

        {children}
      </section>
    </main>
  )
}
