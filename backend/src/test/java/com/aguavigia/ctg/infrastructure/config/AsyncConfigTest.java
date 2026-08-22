package com.aguavigia.ctg.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sin un TaskExecutor propio, Spring Boot cae en SimpleAsyncTaskExecutor: un hilo del sistema
 * operativo por tarea, sin cola ni tope. Un corte confirmado en un barrio con 500 suscriptores son
 * 500 hilos de golpe esperando a un SMTP. Este test existe para que borrar el bean se note.
 */
class AsyncConfigTest {

    private final TaskExecutor ejecutor = new AsyncConfig().taskExecutor();

    @Test
    void debeSerUnPoolAcotadoYNoUnHiloPorTarea() {
        assertThat(ejecutor).isInstanceOf(ThreadPoolTaskExecutor.class);

        ThreadPoolTaskExecutor pool = (ThreadPoolTaskExecutor) ejecutor;
        assertThat(pool.getCorePoolSize()).isEqualTo(4);
        assertThat(pool.getMaxPoolSize()).isEqualTo(8);
        assertThat(pool.getThreadPoolExecutor().getQueue().remainingCapacity()).isEqualTo(500);
    }

    /**
     * Con la cola llena, la tarea se ejecuta en el hilo que la pidió — más lento, pero el correo
     * sale. Descartarla en silencio sería perder el aviso justo cuando más gente lo necesita.
     */
    @Test
    void debeEjecutarEnElLlamadorEnVezDeDescartarCuandoSeSatura() {
        ThreadPoolTaskExecutor pool = (ThreadPoolTaskExecutor) ejecutor;

        assertThat(pool.getThreadPoolExecutor().getRejectedExecutionHandler())
                .isInstanceOf(ThreadPoolExecutor.CallerRunsPolicy.class);
    }

    @Test
    void debeEsperarALasTareasEnVueloAlApagarse() {
        ThreadPoolTaskExecutor pool = (ThreadPoolTaskExecutor) ejecutor;
        pool.shutdown();

        // Si no esperara, un `docker compose down` cortaría a la mitad los correos ya encolados.
        assertThat(pool.getThreadPoolExecutor().isTerminated()).isTrue();
    }
}
