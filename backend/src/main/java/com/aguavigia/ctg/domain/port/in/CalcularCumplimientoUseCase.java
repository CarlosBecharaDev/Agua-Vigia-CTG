package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.SectorId;

/** RF020-RF022 — módulo estrella: compara duración prometida contra duración real. */
public interface CalcularCumplimientoUseCase {

    IndiceCumplimiento porCorte(CorteId corteId);

    IndiceCumplimiento porSector(SectorId sectorId);

    IndiceCumplimiento global();
}
