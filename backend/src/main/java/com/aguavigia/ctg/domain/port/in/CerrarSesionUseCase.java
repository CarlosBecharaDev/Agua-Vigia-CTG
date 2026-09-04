package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.UsuarioId;

/**
 * Cerrar sesión de verdad y no solo borrar el token del navegador: revoca en el servidor todas las
 * sesiones vivas de esa cuenta. Un token robado antes del cierre deja de servir en el acto.
 */
public interface CerrarSesionUseCase {

    void cerrar(UsuarioId usuarioId);
}
