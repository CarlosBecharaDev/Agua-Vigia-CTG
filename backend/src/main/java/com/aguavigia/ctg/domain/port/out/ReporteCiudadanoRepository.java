package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Duration;
import java.util.List;

public interface ReporteCiudadanoRepository {

    ReporteCiudadano guardar(ReporteCiudadano reporte);

    List<ReporteCiudadano> listarRecientesPorSector(SectorId sectorId, Duration ventana);
}
