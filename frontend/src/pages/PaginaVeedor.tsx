/**
 * PaginaVeedor — puerta de la mesa de correcciones.
 *
 * La versión anterior partía la pantalla en dos y pintaba la mitad izquierda con
 * --color-marino sobre texto blanco. Ese token se invierte en carta de noche (pasa a
 * valer papel claro), así que el titular quedaba blanco sobre crema, por debajo de
 * cualquier umbral legible. Aquí la pantalla es una sola hoja que usa los colores del
 * sistema sin invertir nada, y por eso funciona igual en los dos temas.
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { cerrarSesionVeedor, iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, sesionVeedor } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { PanelVeedor } from '../components/PanelVeedor'
import '../components/PanelVeedor.css'

export default function PaginaVeedor() {
  const [autenticado, setAutenticado] = useState(Boolean(sesionVeedor.obtener()))
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const iniciar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesionVeedor(clave)
      setClave('')
      setAutenticado(true)
    } catch (causa) {
      setError(normalizarErrorApi(causa).detalle)
    } finally {
      setEnviando(false)
    }
  }

  const cerrar = () => {
    cerrarSesionVeedor()
    setAutenticado(false)
  }

  if (autenticado) {
    return <PageWrapper><PanelVeedor onCerrarSesion={cerrar} /></PageWrapper>
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado">
        <section className="acceso-carta" aria-labelledby="titulo-veedor">
          <p className="rotulo-carta acceso-rotulo">Acceso restringido</p>
          <h1 id="titulo-veedor">Ingreso del veedor</h1>
          {/* Itálica hidrográfica: la única línea de la portada que habla del agua. */}
          <p className="rotulo-hidrografico acceso-lema">Quien corrige la carta responde por ella</p>

          <p className="acceso-nota">
            Desde aquí se moderan los reportes de los vecinos, se registran los cortes
            oficiales y se aprueban las propuestas de la ingesta. Cada decisión queda
            firmada por la sesión que la tomó.
          </p>

          <form onSubmit={iniciar}>
            <label htmlFor="clave-veedor">Clave del veedor</label>
            <div className={`campo-con-icono campo-clave${clave ? ' con-valor' : ''}`}>
              <KeyRound aria-hidden="true" />
              <input
                id="clave-veedor"
                type={mostrarClave ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={clave}
                onChange={(event) => setClave(event.target.value)}
              />
              <button
                type="button"
                aria-label={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'}
                onClick={() => setMostrarClave((actual) => !actual)}
              >
                {mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="aviso-carta aviso-error" role="alert">{error}</p>}

            <button className="boton-carta boton-asentar acceso-entrar" type="submit" disabled={enviando || !clave}>
              {enviando ? <><span className="spinner" /> Verificando…</> : 'Iniciar sesión'}
            </button>
          </form>

          <ul className="acceso-condiciones">
            <li><LockKeyhole size={15} aria-hidden="true" />La sesión dura ocho horas y se borra al cerrar la pestaña.</li>
            <li><ShieldCheck size={15} aria-hidden="true" />Nada se publica en la carta sin que alguien pueda sustentarlo.</li>
          </ul>
        </section>
      </main>
    </PageWrapper>
  )
}
