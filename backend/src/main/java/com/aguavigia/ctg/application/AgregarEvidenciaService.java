package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.AgregarEvidenciaUseCase;
import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;

@Service
public class AgregarEvidenciaService implements AgregarEvidenciaUseCase {

    private final ReporteCiudadanoRepository reportes;
    private final AlmacenamientoPort almacenamiento;

    public AgregarEvidenciaService(ReporteCiudadanoRepository reportes, AlmacenamientoPort almacenamiento) {
        this.reportes = reportes;
        this.almacenamiento = almacenamiento;
    }

    @Override
    public ReporteCiudadano agregarEvidencia(String reporteId, String nombreArchivo, byte[] contenido) {
        ReporteId id = new ReporteId(reporteId);
        ReporteCiudadano reporte = reportes.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + reporteId + "'"));
        
        String url = almacenamiento.guardar(nombreArchivo, contenido);
        ReporteCiudadano conFoto = reporte.conFoto(url);
        return reportes.guardar(conFoto);
    }
}
