package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Evento de la bitácora pública, de solo anexado (RF026-RF028)")
public record EventoBitacoraRespuesta(
        String id,
        @Schema(description = "CORTE_ANUNCIADO, CORTE_CONFIRMADO_POR_CIUDADANOS o CORTE_RESTABLECIDO")
        String tipo,
        @Schema(description = "Nulo si el evento no está atado a un sector")
        String sectorId,
        @Schema(description = "Nulo si el evento no está atado a un corte oficial (p. ej. consenso ciudadano)")
        String corteId,
        Instant timestamp,
        String descripcion) {
}
