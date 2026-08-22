package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.port.in.ActualizarEstadosPorVentanaUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dispara el barrido de ventanas declaradas. El `@Scheduled` vive aquí y no en el servicio para que
 * `application/` no dependa del planificador de Spring: el caso de uso se puede llamar desde un test
 * o desde otro disparador sin arrastrar el framework.
 *
 * Cada minuto, no cada diez como la ingesta: el ciclo de recolección va al ritmo al que publica
 * Acuacar, pero una ventana que empieza a las 9:00 debe verse reflejada a las 9:00, no a las 9:09.
 * El barrido es barato — solo lee las propuestas aprobadas con ventana aún vigente — y no escribe
 * nada cuando no hay transición que aplicar.
 */
@Component
public class PlanificadorDeVentanas {

    private static final Logger log = LoggerFactory.getLogger(PlanificadorDeVentanas.class);

    private final ActualizarEstadosPorVentanaUseCase actualizarEstados;

    public PlanificadorDeVentanas(ActualizarEstadosPorVentanaUseCase actualizarEstados) {
        this.actualizarEstados = actualizarEstados;
    }

    @Scheduled(fixedDelayString = "${aguavigia.ingesta.ventanas-intervalo-ms:60000}")
    public void revisarVentanas() {
        try {
            int cambiados = actualizarEstados.aplicarVentanasVencidas();
            if (cambiados > 0) {
                log.info("Barrido de ventanas: {} sector(es) cambiaron de estado", cambiados);
            }
        } catch (Exception fallo) {
            // Un fallo aquí no puede matar el hilo del planificador: sin este catch, Spring deja de
            // reprogramar la tarea y las ventanas dejan de aplicarse en silencio hasta el reinicio.
            log.warn("El barrido de ventanas falló, se reintenta en el próximo ciclo: {}",
                    fallo.toString());
        }
    }
}
