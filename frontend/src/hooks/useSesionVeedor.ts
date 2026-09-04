import { useCallback, useEffect, useState } from 'react'
import { sesionVeedor } from '../api/client'
import type { Permiso, SesionVeedor } from '../api/client'

/**
 * La sesión como estado de React. Existe porque `sessionStorage` no notifica cambios dentro de la
 * misma pestaña: sin esto, cuando el interceptor de 401 limpia la sesión, cada pantalla se queda
 * mostrando contenido protegido con todas sus consultas fallando en silencio (F1 en client.ts).
 */
export function useSesionVeedor() {
  const [sesion, setSesion] = useState<SesionVeedor | null>(() => sesionVeedor.obtener())

  useEffect(() => sesionVeedor.alCambiar(() => setSesion(sesionVeedor.obtener())), [])

  /**
   * Lo que decide qué se pinta, nunca qué se permite: el backend revalida cada petición. Si el
   * frontend se equivocara y mostrara un botón de más, el servidor responde 403 igual.
   */
  const puede = useCallback(
    (permiso: Permiso) => sesion?.permisos.includes(permiso) ?? false,
    [sesion],
  )

  return {
    sesion,
    autenticado: sesion !== null,
    /** Un ADMIN recién sembrado entra así: la sesión solo abre el alta del segundo factor. */
    debeCompletarSegundoFactor: sesion?.alcance === 'ALTA_SEGUNDO_FACTOR',
    puede,
  }
}
