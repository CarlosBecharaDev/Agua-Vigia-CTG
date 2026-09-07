/** Pie institucional y accesos secundarios de la página principal. */
import type { FC } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Code2, Droplet, Mail } from 'lucide-react'
import { ENLACES } from '../config/navegacion'

export const PieDePagina: FC = () => (
  <footer className="pie-pagina">
    <div className="pie-contenido">
      <Link to="/" className="pie-marca" aria-label="AguaVigía CTG — inicio">
        <span className="pie-marca-mark" aria-hidden="true">
          <Droplet size={20} strokeWidth={2.4} />
        </span>
        <span className="pie-marca-copy">
          <strong>AguaVigía</strong>
          <small>Cartagena de Indias</small>
        </span>
      </Link>

      <nav className="pie-enlaces" aria-label="Enlaces del sitio">
        {ENLACES.map(({ a, etiqueta }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            className={({ isActive }) => `pie-enlace${isActive ? ' is-active' : ''}`}
          >
            {etiqueta}
          </NavLink>
        ))}
      </nav>

      <div className="pie-social">
        <a href="mailto:alertas@aguavigia.com?subject=Suscripción a Alertas" aria-label="Escríbenos por correo">
          <Mail size={18} />
        </a>
        <a
          href="https://github.com/CarlosBecharaDev/Agua-Vigia-CTG"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Código fuente en GitHub"
        >
          <Code2 size={18} />
        </a>
      </div>
    </div>

    <p className="pie-creditos">
      Desarrollado por el equipo AguaVigía — Proyecto de aula, Tecnológico Comfenalco
    </p>
  </footer>
)
