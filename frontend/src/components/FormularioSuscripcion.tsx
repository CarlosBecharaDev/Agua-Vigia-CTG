import { useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, LocateFixed, Mail, Search, Send, X } from 'lucide-react'
import { crearSuscripcion } from '../api/services'
import { normalizarErrorApi } from '../api/client'
import type { Sector } from '../types/tipos-dominio'
import {
  detectarBarrioPorCoordenada,
  emparejarSectorPorNombreBarrio,
  obtenerCoordenadaDelNavegador,
} from '../utils/detectarSectorPorUbicacion'

interface Props {
  sectores: Sector[]
  onFinalizado?: () => void
}

export const FormularioSuscripcion: FC<Props> = ({ sectores, onFinalizado }) => {
  const [correo, setCorreo] = useState('')
  const [sectorIds, setSectorIds] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [detectando, setDetectando] = useState(false)
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null)
  const [barrioDetectado, setBarrioDetectado] = useState<string | null>(null)
  const opciones = useMemo(() => [...sectores].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')), [sectores])
  const opcionesVisibles = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')
    return termino ? opciones.filter((sector) => sector.nombre.toLocaleLowerCase('es').includes(termino)) : opciones
  }, [busqueda, opciones])

  const mutacion = useMutation({ mutationFn: crearSuscripcion })

  const detectarUbicacion = async () => {
    setDetectando(true)
    setErrorUbicacion(null)
    setBarrioDetectado(null)
    try {
      const coordenada = await obtenerCoordenadaDelNavegador()
      const nombreBarrio = await detectarBarrioPorCoordenada(coordenada.latitude, coordenada.longitude)
      if (!nombreBarrio) throw new Error('No identificamos tu barrio dentro de Cartagena. Elígelo de la lista.')
      const sector = emparejarSectorPorNombreBarrio(opciones, nombreBarrio)
      if (!sector) throw new Error(`Detectamos "${nombreBarrio}", pero todavía no está en la lista. Elígelo manualmente.`)
      setSectorIds((actual) => (actual.includes(sector.id) ? actual : [...actual, sector.id]))
      setBarrioDetectado(sector.nombre)
    } catch (causa) {
      setErrorUbicacion(causa instanceof Error ? causa.message : 'No pudimos detectar tu barrio.')
    } finally {
      setDetectando(false)
    }
  }

  const enviar = (event: FormEvent) => {
    event.preventDefault()
    if (!correo.trim() || sectorIds.length === 0) return
    mutacion.mutate({ correo: correo.trim(), sectorIds })
  }

  if (mutacion.isSuccess) {
    return (
      <div className="suscripcion-exito-moderno" role="status">
        <div className="suscripcion-exito-icono">
          <CheckCircle2 size={36} />
        </div>
        <div className="suscripcion-exito-titulos">
          <h3>¡Revisa tu correo!</h3>
          <p>
            Hemos enviado un enlace de confirmación a <strong>{correo}</strong> para los avisos de tus barrios seleccionados.
          </p>
        </div>
        {onFinalizado && (
          <button
            type="button"
            onClick={onFinalizado}
            className="form-suscripcion-boton-enviar"
            style={{ maxWidth: '200px', marginTop: '0.5rem' }}
          >
            Entendido
          </button>
        )}
      </div>
    )
  }

  const error = mutacion.error ? normalizarErrorApi(mutacion.error) : null

  return (
    <form className="form-suscripcion-moderno" onSubmit={enviar}>
      {/* Paso 1: Correo */}
      <div className="form-suscripcion-bloque">
        <div className="form-suscripcion-bloque-cabecera">
          <label htmlFor="correo-suscripcion" className="form-suscripcion-label">
            <span className="form-suscripcion-chip-paso">1</span>
            Correo electrónico
          </label>
        </div>
        <div className="form-suscripcion-input-wrapper">
          <Mail size={18} className="form-suscripcion-input-icono" aria-hidden="true" />
          <input
            id="correo-suscripcion"
            type="email"
            required
            autoComplete="email"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            placeholder="tu-correo@ejemplo.com"
            className="form-suscripcion-input"
          />
        </div>
      </div>

      {/* Paso 2: Selección de Barrios */}
      <div className="form-suscripcion-bloque">
        <div className="form-suscripcion-bloque-cabecera">
          <div className="form-suscripcion-label">
            <span className="form-suscripcion-chip-paso">2</span>
            Barrios a monitorear
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="form-suscripcion-contador-badge">
              {sectorIds.length} {sectorIds.length === 1 ? 'barrio' : 'barrios'}
            </span>
            {sectorIds.length > 0 && (
              <button type="button" onClick={() => setSectorIds([])} className="form-suscripcion-limpiar-btn">
                Limpiar
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          className="form-suscripcion-ubicacion-btn"
          onClick={() => void detectarUbicacion()}
          disabled={detectando}
        >
          <LocateFixed size={16} aria-hidden="true" />
          <span>{detectando ? 'Detectando tu barrio…' : 'Usar mi ubicación automáticamente'}</span>
        </button>
        {barrioDetectado && (
          <p className="form-suscripcion-ubicacion-nota">
            Detectamos que estás en <strong>{barrioDetectado}</strong> y lo agregamos abajo.
          </p>
        )}
        {errorUbicacion && (
          <p className="form-suscripcion-ubicacion-error" role="alert">{errorUbicacion}</p>
        )}

        {/* Buscador de barrios */}
        <div className="form-suscripcion-barrios-search">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar barrio en Cartagena…"
            aria-label="Buscar barrio para seguir"
          />
          {busqueda && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda de barrios"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Lista interactiva */}
        <div className="form-suscripcion-barrios-lista">
          {opcionesVisibles.map((sector) => {
            const seleccionado = sectorIds.includes(sector.id)
            return (
              <label
                key={sector.id}
                className={`form-suscripcion-barrio-item ${seleccionado ? 'seleccionado' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={seleccionado}
                  onChange={(event) =>
                    setSectorIds((actual) =>
                      event.target.checked ? [...actual, sector.id] : actual.filter((id) => id !== sector.id)
                    )
                  }
                  aria-label={sector.nombre}
                />
                <span title={sector.nombre}>{sector.nombre}</span>
              </label>
            )
          })}
          {opciones.length > 0 && opcionesVisibles.length === 0 && (
            <p style={{ gridColumn: '1 / -1', color: 'rgba(226, 232, 240, 0.6)', fontSize: '0.82rem', padding: '0.5rem', textAlign: 'center' }}>
              No se encontró ningún barrio con ese nombre.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="form-suscripcion-error-badge" role="alert">
          {error.detalle}
        </div>
      )}

      {/* Botón de Envío */}
      <button
        type="submit"
        disabled={mutacion.isPending || sectorIds.length === 0 || !correo.trim()}
        className="form-suscripcion-boton-enviar"
      >
        {mutacion.isPending ? (
          <>
            <span className="spinner" /> Enviando solicitud…
          </>
        ) : (
          <>
            <Send size={18} aria-hidden="true" />
            Enviar confirmación
          </>
        )}
      </button>

      <p style={{ fontSize: '0.76rem', color: 'rgba(216, 180, 254, 0.75)', margin: '0.25rem 0 0', textAlign: 'center' }}>
        📧 En entorno local los correos se visualizan en la bandeja de pruebas: <strong style={{ color: '#e9d5ff' }}>http://127.0.0.1:8025</strong>
      </p>
    </form>
  )
}
