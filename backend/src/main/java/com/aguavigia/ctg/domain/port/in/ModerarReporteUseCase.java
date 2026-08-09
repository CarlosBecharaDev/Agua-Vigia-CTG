package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;

/** RF018 — el veedor aprueba o descarta un reporte ciudadano de la cola de moderación. */
public interface ModerarReporteUseCase {

    ReporteCiudadano aprobar(ReporteId id);

    ReporteCiudadano descartar(ReporteId id);
}
