package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Suscripción creada, pendiente de confirmación por correo (RF013)")
public record SuscripcionRespuesta(

        String id,
        String correo,
        List<String> sectorIds,

        @Schema(description = "PENDIENTE_CONFIRMACION, CONFIRMADA o CANCELADA")
        String estado,

        Instant creadaEn) {
}
