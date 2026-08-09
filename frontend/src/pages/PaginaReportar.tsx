import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { FormularioReporte } from '../components/FormularioReporte'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'

export default function PaginaReportar() {
  const [enviado, setEnviado] = useState(false)
  const [parametros] = useSearchParams()
  const datos = useDatosEnVivo()

  if (enviado) {
    return (
      <main id="contenido-principal" className="pagina-estado">
        <section className="estado-pagina" role="status">
          <div className="estado-pagina-icono"><CheckCircle2 aria-hidden="true" /></div>
          <p className="eyebrow">Reporte registrado</p>
          <h1>Gracias por informar a tu comunidad</h1>
          <p>Tu reporte fue recibido y ayudará a confirmar el estado del servicio cuando coincida con otros vecinos.</p>
          <div className="estado-pagina-acciones">
            <Link className="boton boton-primario" to="/">Volver al mapa</Link>
            <button className="boton boton-secundario" type="button" onClick={() => setEnviado(false)}>Enviar otro</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main id="contenido-principal" className="pagina-reportar">
      <header className="cabecera-reportar">
        <p className="eyebrow">Reporte ciudadano · sin registro</p>
        <h1>¿Cómo está el agua en tu barrio?</h1>
        <p>Dos pasos bastan para informar. Publicaremos un cambio en el mapa únicamente cuando varios reportes independientes coincidan.</p>
      </header>

      {datos.cargando && <div className="estado-recurso" role="status">Cargando barrios…</div>}
      {datos.error && !datos.sectores.length && (
        <div className="estado-recurso" role="alert">
          <div><strong>No pudimos cargar los barrios</strong><p>{datos.error}</p></div>
          <button className="boton boton-secundario" type="button" onClick={datos.recargar}>Reintentar</button>
        </div>
      )}
      {!datos.cargando && !datos.error && datos.sectores.length === 0 && (
        <div className="estado-recurso" role="status">Todavía no hay barrios disponibles para reportar.</div>
      )}
      {datos.sectores.length > 0 && (
        <FormularioReporte
          sectores={datos.sectores}
          sectorPreseleccionado={parametros.get('sector') ?? ''}
          onReporteEnviado={() => setEnviado(true)}
        />
      )}
    </main>
  )
}
