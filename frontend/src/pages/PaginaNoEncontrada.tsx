/**
 * PaginaNoEncontrada — el 404.
 *
 * Una carta náutica no inventa lo que queda fuera de su marco: lo corta y lo rotula. Un
 * 404 es exactamente eso, así que la pantalla lo dice con el mismo rayado de
 * .zona-sin-sondar en vez de con un chiste o un dibujo de relleno, y sale de aquí con las
 * dos acciones que sí sirven: el mapa y reportar.
 */
import { Link, useLocation } from 'react-router-dom'
import { PageWrapper } from '../components/PageWrapper'

export default function PaginaNoEncontrada() {
  const { pathname } = useLocation()

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-pliego reticula-carta">
        <article className="pliego">
          <header className="pliego-cabecera">
            <div className="fuera-de-carta zona-sin-sondar" aria-hidden="true" />
            <p className="rotulo-carta pliego-rotulo">Error 404</p>
            <h1 className="pliego-titulo">Esta página no existe</h1>
            <p className="pliego-entradilla">
              La dirección puede estar incompleta o haber cambiado. Nada de lo que buscas se
              perdió: el mapa y el reporte siguen donde estaban.
            </p>
          </header>

          <div className="pliego-cuerpo">
            <div className="pliego-acciones">
              <Link className="boton boton-primario" to="/">Ver el mapa</Link>
              <Link className="boton boton-secundario" to="/reportar">Reportar mi barrio</Link>
            </div>
            {/* Mostrar la ruta que falló ahorra la mitad de los reportes de "no me carga":
                el vecino ve el error de tipeo sin tener que leer la barra del navegador. */}
            <span className="fuera-de-carta-ruta">
              Dirección que intentaste abrir: <span className="sonda">{pathname}</span>
            </span>
          </div>
        </article>
      </main>
    </PageWrapper>
  )
}
