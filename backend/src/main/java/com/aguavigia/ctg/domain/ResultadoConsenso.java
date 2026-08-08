package com.aguavigia.ctg.domain;

import java.util.List;

/** Salida de EvaluarConsensoUseCase (RF009-RF011). */
public record ResultadoConsenso(
        SectorId sectorId,
        boolean alcanzado,
        EstadoServicio nuevoEstado,
        List<ReporteId> reportesQueSustentan) {

    public ResultadoConsenso {
        if (sectorId == null) {
            throw new IllegalArgumentException("El resultado de consenso debe indicar el sector");
        }
        reportesQueSustentan = List.copyOf(reportesQueSustentan);
    }
}
