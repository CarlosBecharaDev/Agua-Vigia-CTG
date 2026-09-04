package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Evento de la bitácora pública, de solo anexado (RF026-RF028)")
public record EventoBitacoraRespuesta(
        String id,
        @Schema(description = "CORTE_ANUNCIADO, CORTE_CONFIRMADO_POR_CIUDADANOS, CORTE_RESTABLECIDO o CORTE_DETECTADO_POR_INGESTA")
        String tipo,
        @Schema(description = "Nulo si el evento no está atado a un sector")
        String sectorId,
        @Schema(description = "Nulo si el evento no está atado a un corte oficial (p. ej. consenso ciudadano)")
        String corteId,
        Instant timestamp,
        String descripcion,
        @Schema(description = "Estado del servicio que afirma el evento: CON_SERVICIO, SIN_SERVICIO, "
                + "PRESION_BAJA o CORTE_PROGRAMADO. Nulo si el evento no habla del servicio — "
                + "presentarlo entonces como informativo, sin color de estado.")
        String estado,
        @Schema(description = "Boletín o nota que respalda el evento. Nulo si la fuente no lo trae.")
        String urlOriginal,
        @Schema(description = "Portada del boletín. Nula si la fuente no la trae.")
        String imagenUrl) {
}
