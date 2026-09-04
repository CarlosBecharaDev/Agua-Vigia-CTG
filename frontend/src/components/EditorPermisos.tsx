import { useMemo, useState } from 'react'
import type { Permiso, RolVeedor } from '../api/client'
import type { AjustePermisos, CuentaPanel } from '../api/services'
import './Cuentas.css'

/** Los permisos base de cada rol. Espejo de RolVeedor en el backend, que es quien decide de verdad. */
const PERMISOS_POR_ROL: Record<RolVeedor, Permiso[]> = {
  OBSERVADOR: ['VER_PANEL', 'CONFIGURAR_SEGUNDO_FACTOR'],
  VEEDOR: [
    'VER_PANEL',
    'MODERAR_REPORTES',
    'GESTIONAR_CORTES',
    'REVISAR_INGESTA',
    'CONFIGURAR_SEGUNDO_FACTOR',
  ],
  ADMIN: [
    'VER_PANEL',
    'MODERAR_REPORTES',
    'GESTIONAR_CORTES',
    'REVISAR_INGESTA',
    'GESTIONAR_USUARIOS',
    'VER_AUDITORIA',
    'CONFIGURAR_SEGUNDO_FACTOR',
  ],
}

/** Qué significa cada permiso en el trabajo diario, no cómo se llama en el código. */
const DESCRIPCION: Record<Permiso, string> = {
  VER_PANEL: 'Ver el panel y sus colas',
  MODERAR_REPORTES: 'Aprobar o descartar reportes ciudadanos',
  GESTIONAR_CORTES: 'Registrar cortes y cerrarlos con su hora real',
  REVISAR_INGESTA: 'Aprobar o descartar lo que propone la ingesta',
  GESTIONAR_USUARIOS: 'Aprobar cuentas y asignar permisos',
  VER_AUDITORIA: 'Leer la bitácora de auditoría de cuentas',
  CONFIGURAR_SEGUNDO_FACTOR: 'Dar de alta su propio segundo factor',
}

/**
 * CONFIGURAR_SEGUNDO_FACTOR no aparece: lo tienen todos los roles y el backend rechaza revocarlo,
 * porque sin él un ADMIN no podría entrar ni dar de alta su TOTP. Ofrecer una casilla que el
 * servidor va a rechazar solo sirve para que alguien la pruebe y reciba un error.
 */
const AJUSTABLES: Permiso[] = [
  'VER_PANEL',
  'MODERAR_REPORTES',
  'GESTIONAR_CORTES',
  'REVISAR_INGESTA',
  'GESTIONAR_USUARIOS',
  'VER_AUDITORIA',
]

const ROLES: RolVeedor[] = ['OBSERVADOR', 'VEEDOR', 'ADMIN']

interface Props {
  cuenta?: CuentaPanel
  onGuardar: (permisos: AjustePermisos) => void
  onCancelar: () => void
  textoGuardar: string
  guardando?: boolean
}

/**
 * Edita "rol + ajustes por persona" como una sola lista de casillas: quien administra marca lo que
 * la persona debe poder hacer, y el componente deduce qué es concesión y qué es revocación respecto
 * al rol. Pedir las dos listas por separado obligaría a razonar sobre diferencias mentalmente, que
 * es justo donde se cometen los errores de permisos.
 */
export function EditorPermisos({
  cuenta,
  onGuardar,
  onCancelar,
  textoGuardar,
  guardando = false,
}: Props) {
  const [rol, setRol] = useState<RolVeedor>(cuenta?.rol ?? 'VEEDOR')
  const [marcados, setMarcados] = useState<Set<Permiso>>(
    () => new Set(cuenta?.permisosEfectivos ?? PERMISOS_POR_ROL.VEEDOR),
  )

  /** Al cambiar de rol se reinicia a los permisos de ese rol: arrastrar los ajustes del anterior
   * produce combinaciones que nadie eligió a propósito. */
  const cambiarRol = (nuevo: RolVeedor) => {
    setRol(nuevo)
    setMarcados(new Set(PERMISOS_POR_ROL[nuevo]))
  }

  const alternar = (permiso: Permiso) => {
    setMarcados((actuales) => {
      const copia = new Set(actuales)
      if (copia.has(permiso)) copia.delete(permiso)
      else copia.add(permiso)
      return copia
    })
  }

  const ajuste: AjustePermisos = useMemo(() => {
    const base = new Set(PERMISOS_POR_ROL[rol])
    return {
      rol,
      concedidos: AJUSTABLES.filter((p) => marcados.has(p) && !base.has(p)),
      revocados: AJUSTABLES.filter((p) => !marcados.has(p) && base.has(p)),
    }
  }, [rol, marcados])

  const hayAjustes = (ajuste.concedidos?.length ?? 0) + (ajuste.revocados?.length ?? 0) > 0

  return (
    <div>
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 1rem' }}>
        <legend className="form-reporte-label" style={{ marginBottom: '0.5rem' }}>
          Rol de base
        </legend>
        <div className="cuentas-filtros" style={{ marginBottom: 0 }}>
          {ROLES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="cuentas-filtro"
              aria-pressed={rol === opcion}
              onClick={() => cambiarRol(opcion)}
            >
              {opcion}
            </button>
          ))}
        </div>
        {rol === 'ADMIN' && (
          <p className="cuenta-pista">
            El rol ADMIN exige segundo factor: al entrar por primera vez tendrá que activarlo antes
            de poder hacer nada más.
          </p>
        )}
      </fieldset>

      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend className="form-reporte-label" style={{ marginBottom: '0.35rem' }}>
          Qué podrá hacer
        </legend>
        <div className="cuentas-permisos">
          {AJUSTABLES.map((permiso) => (
            <label key={permiso} className="cuentas-permiso">
              <input
                type="checkbox"
                checked={marcados.has(permiso)}
                onChange={() => alternar(permiso)}
              />
              {DESCRIPCION[permiso]}
            </label>
          ))}
        </div>
        {hayAjustes && (
          <p className="cuenta-pista">
            Queda con ajustes sobre el rol {rol}: {ajuste.concedidos?.length ?? 0} permiso(s) de más
            y {ajuste.revocados?.length ?? 0} de menos.
          </p>
        )}
      </fieldset>

      <div className="cuentas-acciones" style={{ marginTop: '1.15rem' }}>
        <button
          type="button"
          className="cuentas-btn cuentas-btn-principal"
          onClick={() => onGuardar(ajuste)}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : textoGuardar}
        </button>
        <button type="button" className="cuentas-btn" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
