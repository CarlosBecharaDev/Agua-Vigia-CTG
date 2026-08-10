package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;

public interface ConfirmarReporteUseCase {
    ReporteCiudadano confirmar(ReporteId reporteId, HuellaDispositivo huella);
}
