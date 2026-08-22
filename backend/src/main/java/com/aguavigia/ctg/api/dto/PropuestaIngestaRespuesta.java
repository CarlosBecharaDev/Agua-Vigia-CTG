package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = """
        Propuesta de cambio de estado detectada por la ingesta automatizada (M9), esperando la
        revisión de un veedor. No afecta el mapa público hasta que se apruebe.""")
public record PropuestaIngestaRespuesta(
        String id,
        String sectorId,
        @Schema(description = "SIN_SERVICIO, PRESION_BAJA, CORTE_PROGRAMADO o CON_SERVICIO")
        String estadoPropuesto,
        @Schema(description = "Colector que la detectó", example = "acuacar")
        String fuente,
        @Schema(description = "Enlace al boletín o nota de prensa original", nullable = true)
        String urlOriginal,
        @Schema(description = "Fragmento del que se dedujo el estado, para que el veedor pueda verificarlo")
        String citaTextual,
        @Schema(description = "Entre 0 y 1. La heurística por expresiones regulares emite 0.6 (ADR-025)")
        double confianza,
        Instant detectadaEn,
        @Schema(description = "PENDIENTE, APROBADA o DESCARTADA")
        String estadoRevision) {
}
