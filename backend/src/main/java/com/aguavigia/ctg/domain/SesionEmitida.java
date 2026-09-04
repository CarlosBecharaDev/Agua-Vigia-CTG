package com.aguavigia.ctg.domain;

import java.util.Set;

/**
 * Lo que el login devuelve. Lleva el alcance y los permisos ya resueltos para que el frontend no
 * tenga que deducir qué pintar: una sesión de ALTA_SEGUNDO_FACTOR debe llevar al usuario al QR y a
 * ningún otro sitio, y esa decisión no puede depender de que el cliente la infiera bien.
 */
public record SesionEmitida(
        String token,
        UsuarioId usuarioId,
        String nombre,
        CorreoElectronico correo,
        RolVeedor rol,
        Set<Permiso> permisos,
        AlcanceSesion alcance) {

    public SesionEmitida {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("La sesión debe llevar token");
        }
        permisos = permisos == null ? Set.of() : Set.copyOf(permisos);
    }

    public static SesionEmitida de(Usuario usuario, String token, AlcanceSesion alcance) {
        Set<Permiso> permisos = alcance == AlcanceSesion.ALTA_SEGUNDO_FACTOR
                ? Set.of(Permiso.CONFIGURAR_SEGUNDO_FACTOR)
                : usuario.permisosEfectivos();
        return new SesionEmitida(token, usuario.id(), usuario.nombre(), usuario.correo(),
                usuario.permisos().rol(), permisos, alcance);
    }
}
