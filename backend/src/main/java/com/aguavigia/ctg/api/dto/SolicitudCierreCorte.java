package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

@Schema(description = "Cierre de un corte con la hora real de restablecimiento (RF017)")
public record SolicitudCierreCorte(

        @NotNull
        Instant horaReal) {
}
