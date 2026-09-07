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
        <div className="modal-reporte-cabecera cuenta-cabecera">
          <div className="modal-reporte-icono-titulo">
            <div className="modal-reporte-badge-icono cuenta-cabecera-icono" aria-hidden="true">
              <Icono size={26} />
            </div>
            <div className="modal-reporte-titulos">
              <div className="cuenta-antetitulo">{antetitulo}</div>
              <h1 id={idTitulo} className="cuenta-titulo">
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
