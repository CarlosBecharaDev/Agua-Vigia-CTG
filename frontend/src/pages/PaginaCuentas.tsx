import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ScrollText, ShieldCheck, UserPlus, Users } from 'lucide-react'
import {
  aprobarCuenta,
  cambiarPermisosCuenta,
  invitarCuenta,
  listarAuditoria,
  listarCuentas,
  reactivarCuenta,
  rechazarCuenta,
  suspenderCuenta,
} from '../api/services'
import type { AjustePermisos, CuentaPanel } from '../api/services'
import type { RolVeedor } from '../api/client'
import { normalizarErrorApi } from '../api/client'
import { useSesionVeedor } from '../hooks/useSesionVeedor'
import { PageWrapper } from '../components/PageWrapper'
import { EditorPermisos } from '../components/EditorPermisos'
import '../components/ModalReporte.css'
import '../components/Cuentas.css'

const FILTROS: { etiqueta: string; valor: string }[] = [
  { etiqueta: 'Todas', valor: '' },
  { etiqueta: 'Esperando aprobación', valor: 'PENDIENTE_APROBACION' },
  { etiqueta: 'Sin verificar', valor: 'PENDIENTE_VERIFICACION' },
  { etiqueta: 'Invitadas', valor: 'INVITADA' },
  { etiqueta: 'Activas', valor: 'ACTIVA' },
  { etiqueta: 'Suspendidas', valor: 'SUSPENDIDA' },
]

/** RNF016: el estado nunca se comunica solo por color — la pastilla lleva siempre su texto. */
const PASTILLA: Record<CuentaPanel['estado'], { clase: string; texto: string }> = {
  ACTIVA: { clase: 'cuenta-pastilla-activa', texto: 'Activa' },
  PENDIENTE_APROBACION: { clase: 'cuenta-pastilla-espera', texto: 'Espera aprobación' },
  PENDIENTE_VERIFICACION: { clase: 'cuenta-pastilla-espera', texto: 'Sin verificar correo' },
  INVITADA: { clase: 'cuenta-pastilla-neutra', texto: 'Invitación enviada' },
  SUSPENDIDA: { clase: 'cuenta-pastilla-detenida', texto: 'Suspendida' },
  RECHAZADA: { clase: 'cuenta-pastilla-detenida', texto: 'Rechazada' },
}

/**
 * El panel donde un ADMIN decide quién entra y qué puede hacer.
 *
 * Vive en su propia ruta y no como pestaña del panel de moderación porque son dos trabajos con
 * ritmos distintos: moderar es diario y esto se toca cuando alguien entra o sale del equipo.
 *
 * Los botones que se muestran dependen de los permisos de la sesión, pero eso es pintura: el
 * backend revalida cada llamada y responde 403 igual si el frontend se equivocara.
 */
export default function PaginaCuentas() {
  const { sesion, autenticado, puede } = useSesionVeedor()
  const clienteQuery = useQueryClient()

  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState<{ cuenta: CuentaPanel; modo: 'aprobar' | 'permisos' } | null>(null)
  const [invitando, setInvitando] = useState(false)
  const [verAuditoria, setVerAuditoria] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cuentas = useQuery({
    queryKey: ['cuentas', filtro],
    queryFn: () => listarCuentas(filtro),
    enabled: autenticado,
  })

  const auditoria = useQuery({
    queryKey: ['auditoria-cuentas'],
    queryFn: () => listarAuditoria(100),
    enabled: verAuditoria && puede('VER_AUDITORIA'),
  })

  const refrescar = () => {
    void clienteQuery.invalidateQueries({ queryKey: ['cuentas'] })
    void clienteQuery.invalidateQueries({ queryKey: ['auditoria-cuentas'] })
  }

  // Toda accion termina igual: cierra el formulario abierto, limpia el error y recarga la lista.
  // Se declara una vez y se reparte a cada useMutation en vez de envolver el hook en un helper —
  // llamar hooks desde una funcion anidada es exactamente lo que las reglas de hooks prohiben.
  const alTerminar = {
    onSuccess: () => {
      setError(null)
      setEditando(null)
      setInvitando(false)
      refrescar()
    },
    onError: (causa: unknown) => setError(normalizarErrorApi(causa).detalle),
  }

  const aprobar = useMutation({
    mutationFn: ({ id, permisos }: { id: string; permisos: AjustePermisos }) =>
      aprobarCuenta(id, permisos),
    ...alTerminar,
  })
  const cambiarPermisos = useMutation({
    mutationFn: ({ id, permisos }: { id: string; permisos: AjustePermisos }) =>
      cambiarPermisosCuenta(id, permisos),
    ...alTerminar,
  })
  const rechazar = useMutation({ mutationFn: rechazarCuenta, ...alTerminar })
  const suspender = useMutation({ mutationFn: suspenderCuenta, ...alTerminar })
  const reactivar = useMutation({ mutationFn: reactivarCuenta, ...alTerminar })
  const invitar = useMutation({
    mutationFn: (datos: { correo: string; nombre: string; rol: RolVeedor }) =>
      invitarCuenta(datos.correo, datos.nombre, datos.rol),
    ...alTerminar,
  })

  if (!autenticado) return <Navigate to="/veedor" replace />

  if (!puede('GESTIONAR_USUARIOS')) {
    return (
      <PageWrapper>
        <main id="contenido-principal" tabIndex={-1} className="cuenta-pagina">
          <section className="modal-reporte-contenedor cuenta-tarjeta">
            <h1 style={{ fontSize: '1.3rem', color: '#fff', margin: '0 0 0.5rem' }}>
              Esta zona es solo para administradores
            </h1>
            <p className="cuenta-pista">
              Tu cuenta tiene el rol {sesion?.rol}, que no incluye la gestión de cuentas.
            </p>
            <Link to="/veedor" className="enlace-cuenta">
              Volver al panel
            </Link>
          </section>
        </main>
      </PageWrapper>
    )
  }

  const enviarInvitacion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const datos = new FormData(event.currentTarget)
    invitar.mutate({
      correo: String(datos.get('correo') ?? ''),
      nombre: String(datos.get('nombre') ?? ''),
      rol: String(datos.get('rol') ?? 'VEEDOR') as RolVeedor,
    })
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="cuentas-panel">
       <div className="cuentas-panel-contenedor">
        <div className="cuentas-cabecera">
          <div>
            <Link to="/veedor" className="enlace-cuenta">
              <ArrowLeft size={14} /> Volver al panel
            </Link>
            <h1 style={{ fontSize: '1.6rem', margin: '0.35rem 0 0.15rem', color: '#f8fafc' }}>
              <Users size={22} style={{ verticalAlign: '-3px', marginRight: '0.4rem' }} />
              Cuentas del panel
            </h1>
            <p style={{ margin: 0, color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.86rem' }}>
              Aprueba solicitudes, invita gente y decide qué puede hacer cada quien.
            </p>
          </div>
          <div className="cuentas-acciones">
            <button
              type="button"
              className="cuentas-btn cuentas-btn-principal"
              onClick={() => {
                setInvitando((abierto) => !abierto)
                setEditando(null)
              }}
            >
              <UserPlus size={15} /> Invitar
            </button>
            {puede('VER_AUDITORIA') && (
              <button
                type="button"
                className="cuentas-btn"
                aria-pressed={verAuditoria}
                onClick={() => setVerAuditoria((visible) => !visible)}
              >
                <ScrollText size={15} /> Auditoría
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="form-suscripcion-error-badge" role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {invitando && (
          <section
            className="modal-reporte-contenedor"
            style={{ marginBottom: '1.5rem', maxHeight: 'none' }}
            aria-label="Invitar a una persona"
          >
            <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.85rem', color: '#f8fafc' }}>
              Invitar a una persona
            </h2>
            <form onSubmit={enviarInvitacion} className="form-reporte-moderno">
              <div className="form-reporte-bloque">
                <label htmlFor="invitar-nombre" className="form-reporte-label">
                  Nombre
                </label>
                <input
                  id="invitar-nombre"
                  name="nombre"
                  required
                  minLength={2}
                  maxLength={80}
                  className="form-suscripcion-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-reporte-bloque">
                <label htmlFor="invitar-correo" className="form-reporte-label">
                  Correo
                </label>
                <input
                  id="invitar-correo"
                  name="correo"
                  type="email"
                  required
                  className="form-suscripcion-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-reporte-bloque">
                <label htmlFor="invitar-rol" className="form-reporte-label">
                  Rol
                </label>
                <select
                  id="invitar-rol"
                  name="rol"
                  defaultValue="VEEDOR"
                  className="form-suscripcion-input"
                  style={{ width: '100%' }}
                >
                  <option value="OBSERVADOR">OBSERVADOR — solo lectura del panel</option>
                  <option value="VEEDOR">VEEDOR — modera, registra cortes y revisa ingesta</option>
                  <option value="ADMIN">ADMIN — todo, más la gestión de cuentas</option>
                </select>
                <p className="cuenta-pista">
                  Recibirá un enlace para fijar su clave. Al usarlo queda activa sin más aprobaciones.
                </p>
              </div>
              <div className="cuentas-acciones">
                <button
                  type="submit"
                  className="cuentas-btn cuentas-btn-principal"
                  disabled={invitar.isPending}
                >
                  {invitar.isPending ? 'Enviando…' : 'Enviar invitación'}
                </button>
                <button type="button" className="cuentas-btn" onClick={() => setInvitando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {editando && (
          <section
            className="modal-reporte-contenedor"
            style={{ marginBottom: '1.5rem', maxHeight: 'none' }}
            aria-label="Editar permisos"
          >
            <h2 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem', color: '#f8fafc' }}>
              {editando.modo === 'aprobar' ? 'Aprobar a ' : 'Permisos de '}
              {editando.cuenta.nombre}
            </h2>
            <p className="cuenta-pista" style={{ marginBottom: '1rem' }}>
              {editando.cuenta.correo}
              {editando.modo === 'permisos' &&
                ' · al guardar se cerrarán sus sesiones abiertas para que el cambio aplique ya.'}
            </p>
            <EditorPermisos
              cuenta={editando.cuenta}
              textoGuardar={editando.modo === 'aprobar' ? 'Aprobar cuenta' : 'Guardar permisos'}
              guardando={aprobar.isPending || cambiarPermisos.isPending}
              onCancelar={() => setEditando(null)}
              onGuardar={(permisos) => {
                const entrada = { id: editando.cuenta.id, permisos }
                if (editando.modo === 'aprobar') aprobar.mutate(entrada)
                else cambiarPermisos.mutate(entrada)
              }}
            />
          </section>
        )}

        <div className="cuentas-filtros">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor || 'todas'}
              type="button"
              className="cuentas-filtro"
              aria-pressed={filtro === opcion.valor}
              onClick={() => setFiltro(opcion.valor)}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        <div className="cuentas-tabla-scroll">
          <table className="cuentas-tabla">
            <caption className="sr-only">Cuentas del panel del veedor</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Estado</th>
                <th scope="col">Rol</th>
                <th scope="col">2FA</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.data?.map((cuenta) => {
                const esYo = cuenta.id === sesion?.usuarioId
                const pastilla = PASTILLA[cuenta.estado]
                return (
                  <tr key={cuenta.id}>
                    <td>
                      <strong style={{ color: '#f1f5f9' }}>{cuenta.nombre}</strong>
                      {esYo && <span className="cuenta-pastilla cuenta-pastilla-neutra"> tú</span>}
                      <div style={{ color: 'rgba(203, 213, 225, 0.65)', fontSize: '0.78rem' }}>
                        {cuenta.correo}
                      </div>
                    </td>
                    <td>
                      <span className={`cuenta-pastilla ${pastilla.clase}`}>{pastilla.texto}</span>
                    </td>
                    <td>
                      {cuenta.rol}
                      {(cuenta.permisosConcedidos.length > 0 ||
                        cuenta.permisosRevocados.length > 0) && (
                        <div style={{ color: 'rgba(203, 213, 225, 0.6)', fontSize: '0.72rem' }}>
                          con ajustes
                        </div>
                      )}
                    </td>
                    <td>{cuenta.segundoFactorActivo ? 'Activo' : '—'}</td>
                    <td>
                      {esYo ? (
                        <span className="cuenta-pista">
                          Nadie se administra a sí mismo. Pídeselo a otro administrador.
                        </span>
                      ) : (
                        <div className="cuentas-acciones">
                          {cuenta.estado === 'PENDIENTE_APROBACION' && (
                            <>
                              <button
                                type="button"
                                className="cuentas-btn cuentas-btn-principal"
                                onClick={() => setEditando({ cuenta, modo: 'aprobar' })}
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="cuentas-btn cuentas-btn-peligro"
                                onClick={() => rechazar.mutate(cuenta.id)}
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {cuenta.estado === 'ACTIVA' && (
                            <>
                              <button
                                type="button"
                                className="cuentas-btn"
                                onClick={() => setEditando({ cuenta, modo: 'permisos' })}
                              >
                                Permisos
                              </button>
                              <button
                                type="button"
                                className="cuentas-btn cuentas-btn-peligro"
                                onClick={() => suspender.mutate(cuenta.id)}
                              >
                                Suspender
                              </button>
                            </>
                          )}
                          {cuenta.estado === 'SUSPENDIDA' && (
                            <button
                              type="button"
                              className="cuentas-btn cuentas-btn-principal"
                              onClick={() => reactivar.mutate(cuenta.id)}
                            >
                              Reactivar
                            </button>
                          )}
                          {cuenta.estado === 'PENDIENTE_VERIFICACION' && (
                            <button
                              type="button"
                              className="cuentas-btn cuentas-btn-peligro"
                              onClick={() => rechazar.mutate(cuenta.id)}
                            >
                              Rechazar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {cuentas.isPending && <p className="cuentas-vacio">Cargando cuentas…</p>}
          {cuentas.isError && (
            <p className="cuentas-vacio">{normalizarErrorApi(cuentas.error).detalle}</p>
          )}
          {cuentas.data?.length === 0 && (
            <p className="cuentas-vacio">No hay cuentas en este estado.</p>
          )}
        </div>

        {verAuditoria && puede('VER_AUDITORIA') && (
          <section style={{ marginTop: '2.5rem' }} aria-label="Bitácora de auditoría">
            <h2 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: '0 0 0.25rem' }}>
              <ShieldCheck size={18} style={{ verticalAlign: '-3px', marginRight: '0.35rem' }} />
              Auditoría de cuentas
            </h2>
            <p style={{ margin: '0 0 1rem', color: 'rgba(203, 213, 225, 0.7)', fontSize: '0.84rem' }}>
              Quién le hizo qué a quién. Solo se anexa: no hay forma de editar ni borrar un asiento.
            </p>
            <div className="cuentas-tabla-scroll">
              <table className="cuentas-tabla">
                <caption className="sr-only">Asientos de auditoría de cuentas</caption>
                <thead>
                  <tr>
                    <th scope="col">Cuándo</th>
                    <th scope="col">Acción</th>
                    <th scope="col">Autor</th>
                    <th scope="col">Sobre</th>
                    <th scope="col">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.data?.map((asiento) => (
                    <tr key={asiento.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(asiento.ocurrioEn).toLocaleString('es-CO')}
                      </td>
                      <td>{asiento.accion.replaceAll('_', ' ').toLowerCase()}</td>
                      <td>{asiento.autorCorreo ?? 'sistema'}</td>
                      <td>{asiento.sujetoCorreo ?? '—'}</td>
                      <td>{asiento.detalle ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditoria.isPending && <p className="cuentas-vacio">Cargando auditoría…</p>}
              {auditoria.data?.length === 0 && (
                <p className="cuentas-vacio">Todavía no hay asientos registrados.</p>
              )}
            </div>
          </section>
        )}
       </div>
      </main>
    </PageWrapper>
  )
}
