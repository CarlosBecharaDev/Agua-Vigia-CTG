package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(description = "Solicitud para suscribirse a los avisos de uno o más sectores")
public record SolicitudSuscripcion(

        @NotBlank
        @Email
        @Schema(description = "Correo al que llegarán los avisos", example = "vecino@correo.com")
        String correo,

        @NotEmpty
        @Schema(description = "Identificadores de los sectores a seguir")
        List<String> sectorIds) {
}
