package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud para confirmar un reporte ciudadano por otro vecino")
public record SolicitudConfirmar(
        @Schema(description = "Huella hash del dispositivo del usuario que confirma (ADR-007)", example = "3a7b9c...")
        @NotBlank(message = "La huella del dispositivo es obligatoria")
        @Size(min = 32, max = 128, message = "La huella debe tener entre 32 y 128 caracteres")
        String huella
) {}
