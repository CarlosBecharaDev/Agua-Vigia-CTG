import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'

export default function PaginaNoEncontrada() {
  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado">
        <section className="estado-pagina">
          <span className="estado-pagina-icono" aria-hidden="true"><MapPinOff /></span>
          <p className="eyebrow">Error 404</p>
          <h1>Esta página no existe</h1>
          <p>La dirección puede estar incompleta o haber cambiado.</p>
          <Link className="boton boton-primario" to="/">Ver el mapa</Link>
        </section>
      </main>
    </PageWrapper>
  )
}
