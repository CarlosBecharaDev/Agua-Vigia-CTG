import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditorPermisos } from './EditorPermisos'
import type { CuentaPanel } from '../api/services'

function cuenta(parcial: Partial<CuentaPanel> = {}): CuentaPanel {
  return {
    id: 'c-1',
    correo: 'veedora@aguavigia.co',
    rol: 'VEEDOR',
    permisosEfectivos: ['VER_PANEL', 'MODERAR_REPORTES', 'GESTIONAR_CORTES', 'REVISAR_INGESTA', 'CONFIGURAR_SEGUNDO_FACTOR'],
    ...parcial,
  } as CuentaPanel
}

function renderizar(props: Partial<Parameters<typeof EditorPermisos>[0]> = {}) {
  const onGuardar = vi.fn()
  const onCancelar = vi.fn()
  render(
    <EditorPermisos
      cuenta={cuenta()}
      onGuardar={onGuardar}
      onCancelar={onCancelar}
      textoGuardar="Guardar"
      {...props}
    />,
  )
  return { onGuardar, onCancelar }
}

const guardar = () => fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

describe('EditorPermisos', () => {
  /**
   * CONFIGURAR_SEGUNDO_FACTOR lo tienen todos los roles y el backend rechaza revocarlo: sin él un
   * ADMIN no podría ni activar su TOTP. Ofrecer la casilla solo produce un error del servidor.
   */
  it('no debe ofrecer revocar el permiso de configurar el segundo factor', () => {
    renderizar()
    expect(screen.getAllByRole('checkbox')).toHaveLength(6)
    expect(screen.queryByLabelText(/segundo factor/i)).not.toBeInTheDocument()
  })

  /** Sin tocar nada, guardar no puede inventar concesiones ni revocaciones. */
  it('debe guardar el rol sin ajustes cuando no se cambia ninguna casilla', () => {
    const { onGuardar } = renderizar()
    guardar()
    expect(onGuardar).toHaveBeenCalledWith({ rol: 'VEEDOR', concedidos: [], revocados: [] })
  })

  it('debe registrar como revocacion desmarcar un permiso que el rol si trae', () => {
    const { onGuardar } = renderizar()
    fireEvent.click(screen.getByLabelText('Aprobar o descartar reportes ciudadanos'))
    guardar()
    expect(onGuardar).toHaveBeenCalledWith({ rol: 'VEEDOR', concedidos: [], revocados: ['MODERAR_REPORTES'] })
  })

  it('debe registrar como concesion marcar un permiso que el rol no trae', () => {
    const { onGuardar } = renderizar()
    fireEvent.click(screen.getByLabelText('Leer la bitácora de auditoría de cuentas'))
    guardar()
    expect(onGuardar).toHaveBeenCalledWith({ rol: 'VEEDOR', concedidos: ['VER_AUDITORIA'], revocados: [] })
  })

  /**
   * Arrastrar los ajustes del rol anterior produce combinaciones que nadie eligió a propósito —
   * en permisos eso es un agujero, no una molestia.
   */
  it('debe reiniciar los permisos al cambiar de rol y no arrastrar los ajustes previos', () => {
    const { onGuardar } = renderizar()
    fireEvent.click(screen.getByLabelText('Aprobar o descartar reportes ciudadanos'))
    fireEvent.click(screen.getByRole('button', { name: 'OBSERVADOR' }))
    guardar()
    expect(onGuardar).toHaveBeenCalledWith({ rol: 'OBSERVADOR', concedidos: [], revocados: [] })
  })

  it('debe avisar que el rol ADMIN exige segundo factor antes de guardarlo', () => {
    renderizar()
    expect(screen.queryByText(/exige segundo factor/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'ADMIN' }))
    expect(screen.getByText(/exige segundo factor/i)).toBeInTheDocument()
  })

  it('debe contar los ajustes sobre el rol para que quien administra los vea antes de guardar', () => {
    renderizar()
    fireEvent.click(screen.getByLabelText('Aprobar o descartar reportes ciudadanos'))
    fireEvent.click(screen.getByLabelText('Leer la bitácora de auditoría de cuentas'))
    expect(screen.getByText(/1 permiso\(s\) de más y 1 de menos/i)).toBeInTheDocument()
  })

  it('no debe permitir guardar dos veces mientras la peticion esta en curso', () => {
    renderizar({ guardando: true })
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
  })
})
