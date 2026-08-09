package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credencial de acceso al panel del veedor")
public record CredencialVeedor(

        @NotBlank
        @Schema(description = "Clave de acceso del veedor")
        String clave) {
}
