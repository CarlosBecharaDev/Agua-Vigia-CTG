package com.aguavigia.ctg.infrastructure.logging;

import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;
import org.springframework.lang.NonNull;

import java.util.Map;

/**
 * MDC vive en un ThreadLocal: sin este decorator, el correlationId puesto por CorrelationIdFilter
 * no llega al hilo del pool de AsyncConfig, y el correo o el push de un sector quedan sin poder
 * cruzarse con la peticion HTTP que los origino en los logs.
 */
public class MdcTaskDecorator implements TaskDecorator {

    @Override
    @NonNull
    public Runnable decorate(@NonNull Runnable tarea) {
        Map<String, String> contextoDelHiloQueEncola = MDC.getCopyOfContextMap();

        return () -> {
            Map<String, String> contextoPrevioDelHiloDelPool = MDC.getCopyOfContextMap();
            if (contextoDelHiloQueEncola != null) {
                MDC.setContextMap(contextoDelHiloQueEncola);
            }
            try {
                tarea.run();
            } finally {
                if (contextoPrevioDelHiloDelPool != null) {
                    MDC.setContextMap(contextoPrevioDelHiloDelPool);
                } else {
                    MDC.clear();
                }
            }
        };
    }
}
