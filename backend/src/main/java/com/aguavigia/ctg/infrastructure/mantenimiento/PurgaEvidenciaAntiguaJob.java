package com.aguavigia.ctg.infrastructure.mantenimiento;

import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Data minimization: pasado el período de retención, borra solo el binario de la foto — el dato
 * más pesado y de mayor riesgo de privacidad — y limpia {@code fotoUrl}. El reporte en sí (sector,
 * tipo, timestamp, moderación, confirmaciones) se conserva indefinidamente porque sustenta RF024
 * (serie temporal) y el Índice de Cumplimiento; solo la evidencia fotográfica vence.
 *
 * Deshabilitado por defecto (ver MantenimientoProperties): cuánto tiempo conservar evidencia
 * ciudadana es una decisión de política de datos de cada despliegue, no algo que este backend
 * deba imponer.
 */
@Component
public class PurgaEvidenciaAntiguaJob {

    private static final Logger log = LoggerFactory.getLogger(PurgaEvidenciaAntiguaJob.class);

    private final AlmacenamientoPort almacenamiento;
    private final ReporteCiudadanoRepository reportes;
    private final RelojPort reloj;
    private final MantenimientoProperties propiedades;

    public PurgaEvidenciaAntiguaJob(AlmacenamientoPort almacenamiento,
                                     ReporteCiudadanoRepository reportes,
                                     RelojPort reloj,
                                     MantenimientoProperties propiedades) {
        this.almacenamiento = almacenamiento;
        this.reportes = reportes;
        this.reloj = reloj;
        this.propiedades = propiedades;
    }

    @Scheduled(cron = "${aguavigia.mantenimiento.retencion-evidencia.cron:0 30 3 * * *}")
    public void purgar() {
        if (!propiedades.retencionEvidencia().habilitada()) {
            return;
        }

        Instant limite = reloj.ahora().minus(Duration.ofDays(propiedades.retencionEvidencia().diasRetencion()));
        List<ReporteCiudadano> vencidos = reportes.listarConFotoAnterioresA(limite);

        for (ReporteCiudadano reporte : vencidos) {
            almacenamiento.eliminar(nombreDeArchivo(reporte.fotoUrl()));
            reportes.guardar(reporte.conFoto(null));
        }

        log.info("Purga de evidencia vencida: {} fotos eliminadas (retencion: {} dias)",
                vencidos.size(), propiedades.retencionEvidencia().diasRetencion());
    }

    private static String nombreDeArchivo(String fotoUrl) {
        int barra = fotoUrl.lastIndexOf('/');
        return barra >= 0 ? fotoUrl.substring(barra + 1) : fotoUrl;
    }
}
