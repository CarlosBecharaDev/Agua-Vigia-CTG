package com.aguavigia.ctg.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * Habilita @Async — lo usan MailNotificacionAdapter (para no bloquear el hilo HTTP en el envío de
 * correo), NotificarSuscripcionesService, AlertaPushSectorListener y el emisor SSE de
 * SectorController.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Sin este bean, Spring Boot cae en `SimpleAsyncTaskExecutor`, que crea **un hilo del sistema
     * operativo por tarea y no tiene cola ni tope**. Un corte confirmado en un barrio con 500
     * suscriptores son 500 hilos de golpe, cada uno esperando a un SMTP: es la forma más directa de
     * tumbar el proceso justo cuando más gente necesita el aviso.
     *
     * `CallerRunsPolicy` y no descartar: si la cola de 500 se llena, el aviso se manda en el hilo
     * que lo pidió — más lento, pero el vecino recibe su correo. Perderlo en silencio sería el
     * descarte silencioso que RNF006 prohíbe, aplicado a las notificaciones.
     */
    @Bean
    public TaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor ejecutor = new ThreadPoolTaskExecutor();
        ejecutor.setCorePoolSize(4);
        ejecutor.setMaxPoolSize(8);
        ejecutor.setQueueCapacity(500);
        ejecutor.setThreadNamePrefix("aguavigia-async-");
        ejecutor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // Que un `docker compose down` no corte a la mitad los correos que ya estaban en vuelo.
        ejecutor.setWaitForTasksToCompleteOnShutdown(true);
        ejecutor.setAwaitTerminationSeconds(20);
        ejecutor.initialize();
        return ejecutor;
    }
}
