package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;

@Service
public class ConfirmarReporteService implements ConfirmarReporteUseCase {

    private final ReporteCiudadanoRepository reportes;
    private final EvaluarConsensoUseCase evaluarConsenso;

    public ConfirmarReporteService(ReporteCiudadanoRepository reportes, EvaluarConsensoUseCase evaluarConsenso) {
        this.reportes = reportes;
        this.evaluarConsenso = evaluarConsenso;
    }

    @Override
    public ReporteCiudadano confirmar(ReporteId reporteId, HuellaDispositivo huella) {
        ReporteCiudadano reporte = reportes.buscarPorId(reporteId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + reporteId.valor() + "'"));

        ReporteCiudadano reporteConfirmado = reporte.confirmar(huella);

        reportes.guardar(reporteConfirmado);

        // M11 no alimenta el consenso: confirmar no llama a ContadorReportesPort.registrar(), así
        // que esta reevaluación no puede cambiar el resultado de EvaluarConsensoService todavía.
        // Se deja la llamada por si RF009-RF011 evoluciona a contar confirmaciones como sustento.
        evaluarConsenso.evaluar(reporteConfirmado.sectorId());

        return reporteConfirmado;
    }
}
