package com.aguavigia.ctg.api.dto;

import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.Usuario;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Nunca lleva `claveHash` ni `secretoTotp`. No es un olvido afortunado: son justamente los dos
 * campos por los que existe la regla de no exponer entidades de dominio en la API.
 */
@Schema(description = "Cuenta del panel, tal como la ve un ADMIN")
public record UsuarioRespuesta(
        String id,
        String correo,
        String nombre,

        @Schema(description = "PENDIENTE_VERIFICACION, PENDIENTE_APROBACION, INVITADA, ACTIVA, SUSPENDIDA o RECHAZADA")
        String estado,

        String rol,
        List<String> permisosEfectivos,
        List<String> permisosConcedidos,
        List<String> permisosRevocados,
        boolean segundoFactorActivo,
        Instant creadoEn,
        Instant actualizadoEn) {

    public static UsuarioRespuesta de(Usuario usuario) {
        return new UsuarioRespuesta(
                usuario.id().valor(),
                usuario.correo().valor(),
                usuario.nombre(),
                usuario.estado().name(),
                usuario.permisos().rol().name(),
                aNombres(usuario.permisosEfectivos()),
                aNombres(usuario.permisos().concedidos()),
                aNombres(usuario.permisos().revocados()),
                usuario.tieneSegundoFactorConfirmado(),
                usuario.creadoEn(),
                usuario.actualizadoEn());
    }

    private static List<String> aNombres(java.util.Set<Permiso> permisos) {
        return permisos.stream().map(Permiso::name).sorted().toList();
    }
}
