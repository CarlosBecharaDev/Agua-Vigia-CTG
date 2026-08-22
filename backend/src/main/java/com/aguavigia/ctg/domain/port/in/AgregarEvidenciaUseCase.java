package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ReporteCiudadano;

public interface AgregarEvidenciaUseCase {

    /** {@code contentType} es el declarado por el cliente (p. ej. "image/jpeg"); se valida contra una lista blanca. */
    ReporteCiudadano agregarEvidencia(String reporteId, String contentType, byte[] contenido);
}
