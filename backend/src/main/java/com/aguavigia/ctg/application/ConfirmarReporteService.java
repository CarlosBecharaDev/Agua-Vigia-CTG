package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfirmarReporteService implements ConfirmarReporteUseCase {

    private final ReporteCiudadanoRepository reportes;
    private final EvaluarConsensoUseCase evaluarConsenso;

    public ConfirmarReporteService(ReporteCiudadanoRepository reportes, EvaluarConsensoUseCase evaluarConsenso) {
        this.reportes = reportes;
        this.evaluarConsenso = evaluarConsenso;
    }

    @Override
    @Transactional
    public ReporteCiudadano confirmar(ReporteId reporteId, HuellaDispositivo huella) {
        ReporteCiudadano reporte = reportes.buscarPorId(reporteId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + reporteId.valor() + "'"));

        ReporteCiudadano reporteConfirmado = reporte.confirmar(huella);
        
        reportes.guardar(reporteConfirmado);
        
        // Re-evaluate consensus after confirmation
        evaluarConsenso.evaluar(reporteConfirmado.sectorId());

        return reporteConfirmado;
    }
}
