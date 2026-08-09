package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

public interface ReporteCiudadanoRepository {

    ReporteCiudadano guardar(ReporteCiudadano reporte);

    List<ReporteCiudadano> listarRecientesPorSector(SectorId sectorId, Duration ventana);

    Optional<ReporteCiudadano> buscarPorId(ReporteId id);

    /** RF018 — la cola de moderación del veedor. */
    List<ReporteCiudadano> listarPendientes();
}
