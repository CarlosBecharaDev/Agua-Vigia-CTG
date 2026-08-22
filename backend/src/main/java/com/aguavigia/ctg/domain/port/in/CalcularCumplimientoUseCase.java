package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.PuntoSerieCumplimiento;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Instant;
import java.util.List;

/** RF020-RF022 — módulo estrella: compara duración prometida contra duración real. */
public interface CalcularCumplimientoUseCase {

    IndiceCumplimiento porCorte(CorteId corteId);

    IndiceCumplimiento porSector(SectorId sectorId);

    IndiceCumplimiento global();

    /**
     * RF024 — evolución del índice en el tiempo, un punto por mes con al menos un corte cerrado.
     *
     * {@code sectorId} nulo = la ciudad completa. {@code desde} y {@code hasta} son opcionales
     * (nulo = sin límite por ese lado) y acotan por la hora real de restablecimiento, que es cuando
     * el corte quedó medible.
     *
     * Devuelve lista vacía —no una excepción— cuando no hay cortes cerrados en el rango: una serie
     * sin datos es una respuesta legítima, a diferencia de pedir el índice de un corte concreto que
     * todavía está abierto.
     */
    List<PuntoSerieCumplimiento> serieMensual(SectorId sectorId, Instant desde, Instant hasta);
}
