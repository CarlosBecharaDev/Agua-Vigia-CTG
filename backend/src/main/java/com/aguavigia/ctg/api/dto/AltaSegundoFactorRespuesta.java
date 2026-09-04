package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Datos para dar de alta el segundo factor. El secreto solo se muestra aqui, una vez.")
public record AltaSegundoFactorRespuesta(

        @Schema(description = "URI otpauth:// para pintar el QR")
        String uri,

        @Schema(description = "El mismo secreto en Base32, para teclearlo si la camara falla")
        String secreto) {
}
