import { useEffect, useState } from 'react'
import { KeyRound, LockKeyhole, RotateCcwKey, ShieldCheck, UserPlus, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cerrarSesionVeedor } from '../api/services'
import { useSesionVeedor } from '../hooks/useSesionVeedor'
import { PanelVeedor } from './PanelVeedor'
import { AltaSegundoFactor } from './AltaSegundoFactor'
import { FormularioIngreso } from './FormularioIngreso'
import { FormularioSolicitarCuenta } from './FormularioSolicitarCuenta'
import { FormularioOlvideClave } from './FormularioOlvideClave'
import './ModalReporte.css'
import './SeccionVeedor.css'
import './Cuentas.css'

interface Props {
  /** El ingreso es emergente: lo abre "Ir al panel" desde el llamado a la veeduría. */
  loginAbierto: boolean
  onCerrarLogin: () => void
}

type Vista = 'ingreso' | 'registro' | 'olvide'

/**
 * Las tres son el mismo trámite —conseguir acceso al panel— y por eso ocurren en el mismo sitio.
 * Antes "Solicitar una cuenta" y "Olvidé mi clave" navegaban a `/cuentas/*`, lo que cerraba la
 * portada y dejaba al usuario en otra pantalla para pedirle un correo.
 */
const VISTAS: Record<Vista, { icono: LucideIcon; antetitulo: string; titulo: string; descripcion: string }> = {
  ingreso: {
    icono: ShieldCheck,
    antetitulo: 'Acceso restringido',
    titulo: 'Ingreso del Veedor',
    descripcion: 'Centro de moderación oficial y control operativo.',
  },
  registro: {
    icono: UserPlus,
    antetitulo: 'Veeduría ciudadana',
    titulo: 'Solicitar una cuenta',
    descripcion: 'Confirma tu correo y un administrador revisará tu solicitud.',
  },
  olvide: {
    icono: RotateCcwKey,
    antetitulo: 'Panel del veedor',
    titulo: 'Restablecer la clave',
    descripcion: 'Te enviamos un enlace de un solo uso, válido 30 minutos.',
  },
}

export function SeccionVeedor({ loginAbierto, onCerrarLogin }: Props) {
  const { autenticado, debeCompletarSegundoFactor } = useSesionVeedor()
  const [vista, setVista] = useState<Vista>('ingreso')

  useEffect(() => {
    if (!loginAbierto) return
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrarLogin()
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [loginAbierto, onCerrarLogin])

  // Cerrar y volver a abrir empieza por el ingreso: reabrir en "Restablecer la clave" obligaría a
  // deshacer un paso que nadie pidió esta vez.
  useEffect(() => {
    if (!loginAbierto) setVista('ingreso')
  }, [loginAbierto])

  const cerrar = () => {
    void cerrarSesionVeedor()
  }

  // El panel autenticado necesita toda la página; el ingreso, en cambio, es un trámite corto y
  // por eso pasa a ser emergente. Se separan porque son dos cosas distintas, no dos estados de una.
  if (autenticado) {
    return (
      <section id="panel-veedor" className="seccion-veedor-root">
        {debeCompletarSegundoFactor ? (
          <AltaSegundoFactor obligatorio onCancelar={cerrar} />
        ) : (
          <PanelVeedor onCerrarSesion={cerrar} />
        )}
      </section>
    )
  }

  if (!loginAbierto) return null

  const { icono: Icono, antetitulo, titulo, descripcion } = VISTAS[vista]
  const volverAlIngreso = () => setVista('ingreso')

  return (
    <div
      className="veedor-modal-fondo"
      role="presentation"
      // Solo cierra si el clic nace y muere en el fondo: arrastrar desde dentro del formulario
      // hasta fuera no debe cerrar lo que se estaba escribiendo.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrarLogin()
      }}
    >
      <div className="veedor-modal-caja" role="dialog" aria-modal="true" aria-labelledby="titulo-veedor">
        <button
          type="button"
          className="veedor-modal-cerrar"
          onClick={onCerrarLogin}
          aria-label="Cerrar el ingreso del veedor"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="seccion-veedor-contenido">
          <div className="modal-reporte-contenedor veedor-modal-tarjeta" aria-labelledby="titulo-veedor">
            {/* Fondo animado morado */}
            <div className="modal-reporte-fondo-animado" aria-hidden="true">
              <div className="orbe-rep-1" />
              <div className="orbe-rep-2" />
            </div>

            <div className="modal-reporte-cabecera veedor-modal-cabecera">
              <div className="modal-reporte-icono-titulo">
                <div className="modal-reporte-badge-icono veedor-modal-badge" aria-hidden="true">
                  <Icono size={26} />
                </div>
                <div className="modal-reporte-titulos">
                  <div className="veedor-modal-antetitulo">
                    {vista === 'ingreso' ? <LockKeyhole size={12} /> : <KeyRound size={12} />}
                    {antetitulo}
                  </div>
                  <h2 id="titulo-veedor" className="veedor-modal-titulo">
                    {titulo}
                  </h2>
                  <p>{descripcion}</p>
                </div>
              </div>
            </div>

            {vista === 'ingreso' && (
              <FormularioIngreso
                onIngreso={onCerrarLogin}
                onSolicitarCuenta={() => setVista('registro')}
                onOlvideClave={() => setVista('olvide')}
              />
            )}
            {vista === 'registro' && <FormularioSolicitarCuenta onVolverAlIngreso={volverAlIngreso} />}
            {vista === 'olvide' && <FormularioOlvideClave onVolverAlIngreso={volverAlIngreso} />}
          </div>
        </div>
      </div>
    </div>
  )
}
