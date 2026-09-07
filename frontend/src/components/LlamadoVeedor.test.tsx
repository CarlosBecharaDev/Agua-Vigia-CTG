import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LlamadoVeedor } from './LlamadoVeedor'

describe('LlamadoVeedor', () => {
  it('ofrece acciones reales sin colas, firmas ni radicados simulados', () => {
    render(<LlamadoVeedor onSuscribirse={vi.fn()} onAbrirPanel={vi.fn()} />)

    expect(screen.getByRole('button', { name: /recibir alertas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar como veedor/i })).toBeInTheDocument()
    expect(screen.queryByText(/RAD-4821|1[.,]248|reportes coincidentes/i)).not.toBeInTheDocument()
  })
})
