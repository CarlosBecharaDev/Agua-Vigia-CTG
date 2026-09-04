package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Fijar clave desde un enlace de un solo uso (invitacion o restablecimiento)")
public record SolicitudFijarClave(

        @NotBlank
        @Schema(description = "Token que venia en el enlace del correo")
        String token,

        @NotBlank
        String clave) {
}
