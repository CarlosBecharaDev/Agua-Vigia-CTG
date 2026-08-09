package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Coordenada GPS del reporte, solo cuando el usuario la autoriza (RF007)")
public record CoordenadaDTO(

        @NotNull
        @DecimalMin("-90") @DecimalMax("90")
        Double latitud,

        @NotNull
        @DecimalMin("-180") @DecimalMax("180")
        Double longitud) {
}
