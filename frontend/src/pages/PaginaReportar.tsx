import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Megaphone } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { normalizarErrorApi } from '../api/client'
import { registrarReporteCiudadano } from '../api/services'
import type { TipoReporte } from '../api/services'
import { EnlaceConfirmarReporte } from '../components/EnlaceConfirmarReporte'

const OPCIONES: Array<{ tipo: TipoReporte; etiqueta: string; descripcion: string }> = [
  { tipo: 'SIN_AGUA', etiqueta: 'Estoy sin agua', descripcion: 'No llega agua al barrio.' },
  { tipo: 'PRESION_BAJA', etiqueta: 'Tengo baja presión', descripcion: 'El servicio llega con poca fuerza.' },
  { tipo: 'SERVICIO_RESTABLECIDO', etiqueta: 'Ya volvió el agua', descripcion: 'El servicio se restableció.' },
]

export default function PaginaReportar() {
  const { sectores, cargando } = useDatosEnVivo()
  const [searchParams] = useSearchParams()
  const sectorPreseleccionado = searchParams.get('sector') ?? ''
  const [sectorId, setSectorId] = useState(sectorPreseleccionado)
  const queryClient = useQueryClient()
  const mutacion = useMutation({
    mutationFn: (tipo: TipoReporte) => registrarReporteCiudadano(sectorId, tipo),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['sectores'] }) },
  })
  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return <PageWrapper><main id="contenido-principal" className="pagina-estado pagina-reporte-real"><section className="reporte-real" aria-labelledby="titulo-reportar">
    <div className="reporte-real-intro"><span className="estado-pagina-icono icono-coral" aria-hidden="true"><Megaphone /></span><p className="eyebrow">Participación ciudadana</p><h1 id="titulo-reportar">Reporta el estado de tu barrio</h1><p>Sin registro y en dos pasos. Tu reporte ayuda a confirmar cambios junto con los de otros vecinos.</p></div>
    {mutacion.isSuccess ? <div className="reporte-real-exito" role="status"><CheckCircle2 /><h2>Reporte recibido</h2><p>Gracias por ayudar a mantener informada a Cartagena.</p>{mutacion.data?.id && <EnlaceConfirmarReporte reporteId={mutacion.data.id} />}<button className="boton boton-secundario" type="button" onClick={() => { mutacion.reset(); setSectorId('') }}>Enviar otro reporte</button></div> : <div className="reporte-real-formulario">
      <label htmlFor="sector-reporte"><span className="paso-numero">Paso 1</span>Selecciona tu barrio</label>
      <select id="sector-reporte" value={sectorId} onChange={(event) => setSectorId(event.target.value)} disabled={cargando}><option value="">{cargando ? 'Cargando barrios…' : 'Elige un barrio'}</option>{[...sectores].sort((a,b) => a.nombre.localeCompare(b.nombre,'es')).map((sector) => <option key={sector.id} value={sector.id}>{sector.nombre}</option>)}</select>
      <fieldset disabled={!sectorId || mutacion.isPending}><legend><span className="paso-numero">Paso 2</span>¿Qué está pasando ahora?</legend><div className="opciones-reporte-pagina">{OPCIONES.map((opcion) => <button type="button" key={opcion.tipo} onClick={() => mutacion.mutate(opcion.tipo)}><strong>{opcion.etiqueta}</strong><span>{opcion.descripcion}</span></button>)}</div></fieldset>
      {error && <p className="mensaje-error" role="alert">{error.detalle}</p>}
      <small>Usamos una huella anónima del dispositivo únicamente para limitar reportes repetidos.</small>
    </div>}
  </section></main></PageWrapper>
}
