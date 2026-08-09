package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = """
        Índice de Cumplimiento (RF020-RF022): comparación explícita entre duración prometida y
        real, nunca un porcentaje aislado.""")
public record IndiceCumplimientoRespuesta(
        @Schema(description = "Nulo cuando el índice es por corte o global, no por sector")
        String sectorId,
        long duracionPrometidaSegundos,
        long duracionRealSegundos,
        @Schema(description = "duracionReal - duracionPrometida. Negativa si terminó antes de lo prometido")
        long desviacionSegundos,
        @Schema(description = "Capado en 100 cuando el corte termina antes o a tiempo")
        double porcentajeCumplimiento) {
}
