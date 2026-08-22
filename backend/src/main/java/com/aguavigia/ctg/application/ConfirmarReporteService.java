package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Service;

/**
 * M11 — RF038: confirmar con un toque un reporte que ya existe.
 *
 * No reevalúa el consenso. Confirmar no llama a `ContadorReportesPort.registrar()`, así que
 * `EvaluarConsensoService` leería exactamente el mismo conteo y devolvería el mismo resultado: era
 * una consulta a Mongo y otra a Redis por cada confirmación, garantizadas a no cambiar nada. Si
 * algún día RF009-RF011 evoluciona a contar confirmaciones como sustento, el sitio donde
 * reintroducirlo es aquí.
 */
@Service
public class ConfirmarReporteService implements ConfirmarReporteUseCase {

    private final ReporteCiudadanoRepository reportes;

    public ConfirmarReporteService(ReporteCiudadanoRepository reportes) {
        this.reportes = reportes;
    }

    @Override
    public ReporteCiudadano confirmar(ReporteId reporteId, HuellaDispositivo huella) {
        ReporteCiudadano reporte = reportes.buscarPorId(reporteId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el reporte '" + reporteId.valor() + "'"));

        // B2 — un reporte descartado por moderación (spam) no debe poder seguir acumulando
        // confirmaciones públicas: el mismo error que "no existe", porque para quien confirma es
        // exactamente eso — un reporte que ya no cuenta como válido.
        if (reporte.estadoModeracion() == EstadoModeracion.DESCARTADO) {
            throw new IllegalArgumentException("No existe el reporte '" + reporteId.valor() + "'");
        }

        ReporteCiudadano reporteConfirmado = reporte.confirmar(huella);

        reportes.guardar(reporteConfirmado);

        return reporteConfirmado;
    }
}
