package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

@Schema(description = "Registro de un corte oficial por el veedor (RF016)")
public record SolicitudCorte(

        @NotEmpty
        @Schema(description = "Identificadores de los sectores afectados", example = "[\"manga\", \"bocagrande\"]")
        List<String> sectoresAfectados,

        @NotNull
        Instant inicio,

        @NotNull
        Instant finPrometido,

        @NotBlank
        @Schema(example = "Mantenimiento planta El Bosque")
        String causa) {
}
