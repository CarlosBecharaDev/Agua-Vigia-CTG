package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

/** RNF007 — salud de un colector del pipeline de ingesta (M9). */
@Schema(description = "Estado de salud de un colector de la ingesta automatizada")
public record SaludColectorRespuesta(

        @Schema(example = "acuacar")
        String nombre,

        @Schema(description = "Nulo si el colector todavía no ha completado un ciclo con éxito", nullable = true)
        Instant ultimaEjecucionExitosa,

        @Schema(description = "Nulo si nunca ha fallado", nullable = true)
        Instant ultimoFallo,

        @Schema(description = "Mensaje del último fallo, para diagnosticar sin entrar al servidor", nullable = true)
        String motivoDelUltimoFallo,

        @Schema(description = "Documentos traídos desde que arrancó el proceso")
        long itemsProcesados,

        @Schema(description = "Entre 0 y 1, sobre los ciclos corridos desde que arrancó el proceso")
        double tasaDeError,

        @Schema(description = "Ciclos seguidos fallando. Desde 3, el colector se reporta caído en /actuator/health")
        int fallosConsecutivos) {
}
