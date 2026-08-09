package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Duration;

/** Ventana deslizante de reportes por sector — implementado con Redis (ADR-003). */
public interface ContadorReportesPort {

    void registrar(SectorId sectorId, HuellaDispositivo huella);

    long contarRecientes(SectorId sectorId, Duration ventana);
}
