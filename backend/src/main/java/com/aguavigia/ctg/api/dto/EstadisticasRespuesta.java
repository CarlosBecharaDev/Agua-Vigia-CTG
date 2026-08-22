package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;
import java.util.Map;

@Schema(description = "Estadísticas públicas globales (M7, RF023)")
public record EstadisticasRespuesta(
        List<EstadisticaSectorRespuesta> sectoresMasAfectados,
        Map<String, Integer> cortesPorDiaDeSemana,
        double duracionPromedioHoras) {

    @Schema(description = "Sector con su cantidad de cortes registrados")
    public record EstadisticaSectorRespuesta(String sectorId, String nombre, int cantidadCortes) {}
}
