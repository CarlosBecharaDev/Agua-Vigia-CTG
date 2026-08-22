import type { FC } from 'react'
import { FormularioSuscripcion } from './FormularioSuscripcion'
import { PanelFlotanteFormulario } from './PanelFlotanteFormulario'
import type { Sector } from '../types/tipos-dominio'

interface Props {
  abierto: boolean
  alCerrar: () => void
  sectores: Sector[]
}

export const ModalSuscripcion: FC<Props> = ({ abierto, alCerrar, sectores }) => (
  <PanelFlotanteFormulario abierto={abierto} alCerrar={alCerrar} titulo="Avisos de tu barrio" idTitulo="titulo-modal-suscripcion">
    <FormularioSuscripcion sectores={sectores} />
  </PanelFlotanteFormulario>
)
