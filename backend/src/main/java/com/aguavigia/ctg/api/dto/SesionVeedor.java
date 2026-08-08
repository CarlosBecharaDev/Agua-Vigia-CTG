package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Sesion emitida para el panel del veedor (RNF011: expira en 8 horas)")
public record SesionVeedor(

        @Schema(description = "Token JWT. Se envia como 'Authorization: Bearer <token>'")
        String token) {
}
