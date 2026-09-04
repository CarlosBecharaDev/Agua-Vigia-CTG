package com.aguavigia.ctg.api.dto;

import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.SesionEmitida;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Sesion emitida para el panel del veedor (RNF011: expira en 8 horas)")
public record SesionVeedor(

        @Schema(description = "Token JWT. Se envia como 'Authorization: Bearer <token>'")
        String token,

        String usuarioId,
        String nombre,
        String correo,

        @Schema(description = "ADMIN, VEEDOR u OBSERVADOR")
        String rol,

        @Schema(description = "Permisos efectivos ya resueltos: rol mas concedidos menos revocados")
        List<String> permisos,

        @Schema(description = """
                COMPLETO, o ALTA_SEGUNDO_FACTOR cuando la cuenta es ADMIN y todavia no dio de alta su
                TOTP. Con ese alcance el token solo sirve para /api/veedor/segundo-factor.""")
        String alcance) {

    public static SesionVeedor de(SesionEmitida sesion) {
        return new SesionVeedor(
                sesion.token(),
                sesion.usuarioId().valor(),
                sesion.nombre(),
                sesion.correo().valor(),
                sesion.rol().name(),
                sesion.permisos().stream().map(Permiso::name).sorted().toList(),
                sesion.alcance().name());
    }
}
