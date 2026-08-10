package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Reporte ciudadano registrado")
public record ReporteRespuesta(
        String id,
        String sectorId,
        String tipo,
        Instant timestamp,
        String fotoUrl) {
}
