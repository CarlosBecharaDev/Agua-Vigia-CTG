/**
 * PieDePagina — pie de la página principal, con transición de olas animadas.
 *
 * Tres capas de la misma silueta de ola (SVG, no imagen de trama) deslizándose en bucle a
 * distinta velocidad/opacidad — efecto de profundidad ("parallax") que cierra la página con
 * la misma metáfora de agua que el resto del producto. Cada capa es el mismo <svg>
 * duplicado dos veces dentro de un contenedor al 200%: al animar ese contenedor de 0% a
 * -50% el bucle es perfecto, sin salto, sin importar la forma de la ola.
 *
 * Fondo siempre oscuro (--color-marino) en los dos temas a propósito: el pie es "chrome"
 * fijo, igual que .app-sidebar — no responde al claro/oscuro, es el fondo marino del final
 * de la página.
 */
import type { FC } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Droplet, Mail, Code2, Heart } from 'lucide-react'
import { ENLACES } from '../config/navegacion'

const OLA_FONDO = 'M0,28 Q40,16 80,28 T160,28 T240,28 T320,28 T400,28 T480,28 L480,60 L0,60 Z'
const OLA_MEDIA = 'M0,24 Q35,10 70,24 T140,24 T210,24 T280,24 T350,24 T420,24 L420,60 L0,60 Z'
const OLA_FRENTE = 'M0,20 Q30,4 60,20 T120,20 T180,20 T240,20 T300,20 T360,20 L360,60 L0,60 Z'

function CapaOla({ path, viewBox, clase, fill }: { path: string; viewBox: string; clase: string; fill: string }) {
  return (
    <div className={`pie-ola-capa ${clase}`}>
      <svg viewBox={viewBox} preserveAspectRatio="none"><path d={path} fill={fill} /></svg>
      <svg viewBox={viewBox} preserveAspectRatio="none"><path d={path} fill={fill} /></svg>
    </div>
  )
}

export const PieDePagina: FC = () => (
  <>
    {/* Tres capas a distinta velocidad: el desfase entre ellas es lo que da la sensación de
        agua en movimiento. Van en tonos del propio azul del pie, no en turquesa, para que se
        lea como profundidad y no como una franja de otro color pegada encima. */}
    <div className="pie-olas" aria-hidden="true">
      <CapaOla path={OLA_FONDO} viewBox="0 0 480 60" clase="pie-ola-capa--fondo" fill="var(--color-pie-ola-fondo)" />
      <CapaOla path={OLA_MEDIA} viewBox="0 0 420 60" clase="pie-ola-capa--media" fill="var(--color-pie-ola-media)" />
      <CapaOla path={OLA_FRENTE} viewBox="0 0 360 60" clase="pie-ola-capa--frente" fill="var(--color-pie)" />
    </div>

    <footer className="pie-pagina" role="contentinfo">
      <div className="pie-contenido">
        <Link to="/" className="pie-marca" aria-label="AguaVigía CTG — inicio">
          <span className="pie-marca-mark" aria-hidden="true"><Droplet size={20} strokeWidth={2.4} /></span>
          <span className="pie-marca-copy"><strong>AguaVigía</strong><small>Cartagena de Indias</small></span>
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
        Hecho con <Heart size={12} fill="currentColor" aria-hidden="true" /> por el equipo AguaVigía — Proyecto de aula, Tecnológico Comfenalco
      </p>
    </footer>
  </>
)
