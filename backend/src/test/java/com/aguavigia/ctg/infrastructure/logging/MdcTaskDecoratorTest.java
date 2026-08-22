package com.aguavigia.ctg.infrastructure.logging;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class MdcTaskDecoratorTest {

    private final MdcTaskDecorator decorator = new MdcTaskDecorator();

    @AfterEach
    void limpiar() {
        MDC.clear();
    }

    @Test
    void propagaElContextoDelHiloQueEncolaAlHiloQueEjecuta() throws Exception {
        MDC.put("correlationId", "abc-123");
        AtomicReference<String> visto = new AtomicReference<>();

        Runnable tarea = decorator.decorate(() -> visto.set(MDC.get("correlationId")));
        CompletableFuture.runAsync(tarea).get();

        assertThat(visto.get()).isEqualTo("abc-123");
    }

    @Test
    void noFiltraElContextoAOtraTareaEnElMismoHiloDelPool() throws Exception {
        MDC.put("correlationId", "peticion-1");
        Runnable primeraTarea = decorator.decorate(() -> { });

        MDC.clear();
        MDC.put("correlationId", "hilo-del-pool-sin-relacion");
        AtomicReference<String> visto = new AtomicReference<>();
        Runnable segundaTarea = decorator.decorate(() -> visto.set(MDC.get("correlationId")));

        // Simula que ambas tareas corren en el mismo hilo físico del pool, una después de otra.
        primeraTarea.run();
        segundaTarea.run();

        assertThat(visto.get()).isEqualTo("hilo-del-pool-sin-relacion");
    }

    @Test
    void sinContextoPrevioLimpiaElMdcAlTerminar() throws Exception {
        Runnable tarea = decorator.decorate(() -> { });

        tarea.run();

        assertThat(MDC.getCopyOfContextMap()).isNullOrEmpty();
    }
}
