package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ReporteCiudadano;

public interface AgregarEvidenciaUseCase {
    ReporteCiudadano agregarEvidencia(String reporteId, String nombreArchivo, byte[] contenido);
}
