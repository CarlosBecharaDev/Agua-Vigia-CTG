package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Corte oficial (RF016-RF017)")
public record CorteRespuesta(
        String id,
        List<String> sectoresAfectados,
        Instant inicio,
        Instant finPrometido,
        @Schema(description = "Nulo mientras el corte sigue abierto")
        Instant finReal,
        String causa,
        String origen,
        String estado) {
}
