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
        @Schema(description = """
                Entre 0 y 1, graduada según la evidencia que halló el extractor (ADR-032): 0.85 con
                enumeración explícita de barrios y horario, 0.75 con enumeración sin horario, 0.45
                con una mención suelta en prosa. Sirve para ordenar la cola, no para publicar solo.""")
        double confianza,
        Instant detectadaEn,
        @Schema(description = "PENDIENTE, APROBADA o DESCARTADA")
        String estadoRevision,
        @Schema(description = """
                Inicio de la ventana que el boletín prometió. Nulo cuando el texto no la declaraba:
                no se estima (ADR-006).""", nullable = true)
        Instant inicioDeclarado,
        @Schema(description = """
                Fin prometido de la misma ventana. Junto con el inicio es lo que permite que el
                estado del sector evolucione solo (ADR-033) y lo que alimenta el Índice de
                Cumplimiento (RF020-RF022).""", nullable = true)
        Instant finPrometido) {
}
