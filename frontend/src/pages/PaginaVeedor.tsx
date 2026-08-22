import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react'
import { cerrarSesionVeedor, iniciarSesionVeedor } from '../api/services'
import { normalizarErrorApi, sesionVeedor } from '../api/client'
import { PageWrapper } from '../components/PageWrapper'
import { PanelVeedor } from '../components/PanelVeedor'

export default function PaginaVeedor() {
  const [autenticado, setAutenticado] = useState(Boolean(sesionVeedor.obtener()))
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // F1 — si el JWT vence (8h) o el backend reinicia con otro JWT_SECRET mientras el panel está
  // abierto, el interceptor de 401 borra el token pero nadie más se enteraba: el panel seguía
  // mostrándose como autenticado con todas las consultas fallando en silencio.
  useEffect(() => sesionVeedor.alLimpiarse(() => {
    setAutenticado(false)
    setError('La sesión venció. Inicia sesión de nuevo.')
  }), [])

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
        <section className="acceso-veedor" aria-labelledby="titulo-veedor">
          <div className="veedor-contexto">
            <span className="estado-pagina-icono" aria-hidden="true"><ShieldCheck /></span>
            <p className="eyebrow">Acceso restringido</p>
            <h1 id="titulo-veedor">Ingreso del veedor</h1>
            <p>Un espacio protegido para validar información pública con responsabilidad y trazabilidad.</p>
            <ul><li><LockKeyhole size={16} />Sesión temporal y protegida</li><li><ShieldCheck size={16} />Acciones sujetas al contrato oficial</li></ul>
          </div>
          <form onSubmit={iniciar} className="veedor-formulario">
            <div><span className="paso-numero">Identidad verificada</span><h2>Accede de forma segura</h2><p>La sesión dura como máximo ocho horas y se elimina al cerrar esta pestaña.</p></div>
            <label htmlFor="clave-veedor">Clave del veedor</label>
            <div className={`campo-con-icono campo-clave${clave ? ' con-valor' : ''}`}><KeyRound aria-hidden="true" /><input id="clave-veedor" type={mostrarClave ? 'text' : 'password'} required autoComplete="current-password" value={clave} onChange={(event) => setClave(event.target.value)} /><button type="button" aria-label={mostrarClave ? 'Ocultar clave' : 'Mostrar clave'} onClick={() => setMostrarClave((actual) => !actual)}>{mostrarClave ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            {error && <p className="mensaje-error" role="alert">{error}</p>}
            <button className="boton boton-primario boton-ancho" type="submit" disabled={enviando || !clave}>{enviando ? <><span className="spinner" /> Verificando…</> : 'Iniciar sesión'}</button>
          </form>
        </section>
      </main>
    </PageWrapper>
  )
}
