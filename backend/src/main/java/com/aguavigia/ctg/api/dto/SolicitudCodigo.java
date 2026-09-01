package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Codigo de 6 digitos de la app de autenticacion")
public record SolicitudCodigo(

        @NotBlank
        String codigo) {
}
