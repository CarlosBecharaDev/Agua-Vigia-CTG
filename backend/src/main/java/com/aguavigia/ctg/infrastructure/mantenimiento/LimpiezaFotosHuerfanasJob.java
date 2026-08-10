package com.aguavigia.ctg.infrastructure.mantenimiento;

import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Set;

/**
 * Reconcilia data/fotos contra Mongo y borra archivos que ningún reporte referencia.
 *
 * El caso real no es "reporte descartado por el veedor" — ese reporte conserva su fotoUrl intacta
 * y sigue siendo el dueño legítimo del archivo (ver PurgaEvidenciaAntiguaJob para la retención por
 * antigüedad). El huérfano real es un fallo parcial: AgregarEvidenciaService escribe el archivo en
 * disco antes de guardar el reporte actualizado, y si ese guardado falla después, el archivo queda
 * sin ninguna referencia en Mongo para siempre.
 *
 * La ventana de antigüedad mínima evita el falso positivo de borrar un archivo recién escrito
 * cuyo guardado del reporte todavía está en vuelo.
 */
@Component
public class LimpiezaFotosHuerfanasJob {

    private static final Logger log = LoggerFactory.getLogger(LimpiezaFotosHuerfanasJob.class);

    private final AlmacenamientoPort almacenamiento;
    private final ReporteCiudadanoRepository reportes;
    private final MantenimientoProperties propiedades;

    public LimpiezaFotosHuerfanasJob(AlmacenamientoPort almacenamiento,
                                      ReporteCiudadanoRepository reportes,
                                      MantenimientoProperties propiedades) {
        this.almacenamiento = almacenamiento;
        this.reportes = reportes;
        this.propiedades = propiedades;
    }

    @Scheduled(cron = "${aguavigia.mantenimiento.fotos-huerfanas.cron:0 0 3 * * *}")
    public void limpiar() {
        if (!propiedades.fotosHuerfanas().habilitada()) {
            return;
        }

        Set<String> referenciadas = reportes.listarNombresDeFotoReferenciados();
        Set<String> candidatas = almacenamiento.listarNombresConAntiguedadMinima(
                Duration.ofHours(propiedades.fotosHuerfanas().antiguedadMinimaHoras()));

        int borradas = 0;
        for (String nombre : candidatas) {
            if (!referenciadas.contains(nombre)) {
                almacenamiento.eliminar(nombre);
                borradas++;
            }
        }

        log.info("Limpieza de fotos huerfanas: {} borradas de {} candidatas ({} referenciadas en Mongo)",
                borradas, candidatas.size(), referenciadas.size());
    }
}
