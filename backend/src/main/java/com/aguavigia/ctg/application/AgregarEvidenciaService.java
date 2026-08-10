package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.AgregarEvidenciaUseCase;
import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AgregarEvidenciaService implements AgregarEvidenciaUseCase {

    /**
     * M10: solo imagenes. La extension sale de aqui, nunca del nombre de archivo que manda el
     * cliente — si mas adelante se sirve el directorio de fotos, un ".svg" o ".html" subido con
     * un nombre falsificado se hubiera convertido en XSS almacenado del mismo origen.
     */
    private static final Map<String, String> TIPOS_PERMITIDOS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");

    private final ReporteCiudadanoRepository reportes;
    private final AlmacenamientoPort almacenamiento;

    public AgregarEvidenciaService(ReporteCiudadanoRepository reportes, AlmacenamientoPort almacenamiento) {
        this.reportes = reportes;
        this.almacenamiento = almacenamiento;
    }

    @Override
    public ReporteCiudadano agregarEvidencia(String reporteId, String contentType, byte[] contenido) {
        ReporteId id = new ReporteId(reporteId);
        ReporteCiudadano reporte = reportes.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + reporteId + "'"));

        String extension = contentType == null ? null : TIPOS_PERMITIDOS.get(contentType);
        if (extension == null) {
            throw new IllegalArgumentException(
                    "Tipo de archivo no permitido: '%s'. Solo se aceptan %s.".formatted(contentType, TIPOS_PERMITIDOS.keySet()));
        }

        String url = almacenamiento.guardar(extension, contenido);
        ReporteCiudadano conFoto = reporte.conFoto(url);
        return reportes.guardar(conFoto);
    }
}
