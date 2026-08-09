package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.ModerarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;

/** RF018 (`ADR-023`) — sin regla de negocio propia: la definición de "candidato a moderar" es el enum. */
@Service
public class ModerarReporteService implements ModerarReporteUseCase {

    private final ReporteCiudadanoRepository reportes;

    public ModerarReporteService(ReporteCiudadanoRepository reportes) {
        this.reportes = reportes;
    }

    @Override
    public ReporteCiudadano aprobar(ReporteId id) {
        ReporteCiudadano reporte = buscarOLanzar(id);
        return reportes.guardar(reporte.aprobar());
    }

    @Override
    public ReporteCiudadano descartar(ReporteId id) {
        ReporteCiudadano reporte = buscarOLanzar(id);
        return reportes.guardar(reporte.descartar());
    }

    private ReporteCiudadano buscarOLanzar(ReporteId id) {
        return reportes.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + id.valor() + "'"));
    }
}
