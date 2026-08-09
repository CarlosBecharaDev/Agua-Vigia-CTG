package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ResultadoConsenso;
import com.aguavigia.ctg.domain.SectorId;

/** RF009-RF011 — cambia el estado de un sector cuando N reportes independientes coinciden. */
public interface EvaluarConsensoUseCase {

    ResultadoConsenso evaluar(SectorId sectorId);
}
