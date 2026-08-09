package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Reporte ciudadano en la cola de moderación del veedor (RF018)")
public record ReporteModeracionRespuesta(
        String id,
        String sectorId,
        String tipo,
        @Schema(description = "Nulo si el usuario no autorizó compartir su ubicación (RF007)")
        CoordenadaDTO coordenada,
        Instant timestamp,
        @Schema(description = "PENDIENTE, APROBADO o DESCARTADO")
        String estadoModeracion) {
}
