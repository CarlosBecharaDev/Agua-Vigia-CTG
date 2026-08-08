package com.aguavigia.ctg.domain;

import java.time.Duration;

/**
 * Salida de CalcularCumplimientoUseCase (RF020-RF022). sectorId nulo = índice global de la
 * ciudad. Se presenta como comparación explícita (prometida vs. real), nunca como puntaje
 * aislado — DESIGN.md exige que ambos números viajen juntos.
 */
public record IndiceCumplimiento(
        SectorId sectorId,
        Duration duracionPrometida,
        Duration duracionReal,
        Duration desviacion,
        double porcentajeCumplimiento) {

    public IndiceCumplimiento {
        if (duracionPrometida == null || duracionReal == null) {
            throw new IllegalArgumentException("Duración prometida y real son obligatorias");
        }
        if (desviacion == null) {
            throw new IllegalArgumentException("La desviación es obligatoria");
        }
    }
}
