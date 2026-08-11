package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Un mes de la evolución del Índice de Cumplimiento (RF024)")
public record PuntoSerieRespuesta(

        @Schema(description = "Mes en hora de Cartagena, ISO 8601", example = "2026-08")
        String periodo,

        long duracionPrometidaSegundos,
        long duracionRealSegundos,

        @Schema(description = "duracionReal - duracionPrometida. Negativa si terminaron antes de lo prometido")
        long desviacionSegundos,

        @Schema(description = "Capado en 100 cuando los cortes terminan antes o a tiempo")
        double porcentajeCumplimiento,

        @Schema(description = """
                Cortes cerrados sobre los que se calculó el mes. Un 40% sobre un solo corte y uno
                sobre veinte no significan lo mismo.""")
        int cantidadCortes) {
}
