import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { cerrarSesionVeedor, iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, sesionVeedor } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { PanelVeedor } from '../components/PanelVeedor'

export default function PaginaVeedor() {
  const [autenticado, setAutenticado] = useState(Boolean(sesionVeedor.obtener()))
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
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
      <main id="contenido-principal" className="pagina-estado">
        <section className="acceso-veedor" aria-labelledby="titulo-veedor">
          <span className="estado-pagina-icono" aria-hidden="true"><ShieldCheck /></span>
          <p className="eyebrow">Acceso restringido</p>
          <h1 id="titulo-veedor">Ingreso del veedor</h1>
          <p>La sesión dura como máximo ocho horas y se elimina al cerrar esta pestaña.</p>
          <form onSubmit={iniciar}>
            <label htmlFor="clave-veedor">Clave del veedor</label>
            <div className="campo-con-icono"><KeyRound aria-hidden="true" /><input id="clave-veedor" type="password" required autoComplete="current-password" value={clave} onChange={(event) => setClave(event.target.value)} /></div>
            {error && <p className="mensaje-error" role="alert">{error}</p>}
            <button className="boton boton-primario" type="submit" disabled={enviando}>{enviando ? 'Verificando…' : 'Iniciar sesión'}</button>
          </form>
        </section>
      </main>
    </PageWrapper>
  )
}
