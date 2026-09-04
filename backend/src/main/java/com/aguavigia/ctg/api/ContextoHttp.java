package com.aguavigia.ctg.api;

import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.infrastructure.security.SesionAutenticada;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Traduce "quien hace esta peticion HTTP" al ContextoDeAccion que esperan los casos de uso. Vive en
 * `api/` y no en `application/` porque leer el SecurityContext y la IP del request son detalles del
 * transporte: la capa de aplicacion recibe el dato ya resuelto y no sabe que existe HTTP.
 */
final class ContextoHttp {

    private ContextoHttp() {
    }

    static ContextoDeAccion de(HttpServletRequest peticion) {
        return sesionActual()
                .map(sesion -> new ContextoDeAccion(sesion.id(), ip(peticion)))
                .orElseGet(() -> ContextoDeAccion.anonimo(ip(peticion)));
    }

    static UsuarioId usuarioActual() {
        return sesionActual()
                .map(SesionAutenticada::id)
                .orElseThrow(() -> new IllegalStateException("Esta accion exige una sesion iniciada"));
    }

    static java.util.Optional<SesionAutenticada> sesionActual() {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion == null || !(autenticacion.getPrincipal() instanceof SesionAutenticada sesion)) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.of(sesion);
    }

    /**
     * `getRemoteAddr()` y no la cabecera X-Forwarded-For a mano: `server.forward-headers-strategy`
     * ya hace que Spring reescriba este valor con la IP real detras de nginx (ver application.yml).
     * Leer la cabecera aqui ademas permitiria falsificar la IP de la auditoria desde el cliente.
     */
    private static String ip(HttpServletRequest peticion) {
        return peticion.getRemoteAddr();
    }
}
