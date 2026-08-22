package com.aguavigia.ctg.infrastructure.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * @Scheduled es inerte sin @EnableScheduling: Spring Boot no lo activa por su cuenta
 * (a diferencia de @EnableAsync, que sí trae autoconfiguración condicional). Esta prueba
 * existe para que un PipelineOrquestador que deje de ejecutarse en producción falle aquí,
 * no en runtime silenciosamente.
 */
@SpringBootTest(classes = SchedulingConfig.class)
class SchedulingConfigTest {

    @Test
    void debeRegistrarElPostProcessorQueActivaScheduled(ApplicationContext contexto) {
        assertThat(contexto.getBeansOfType(ScheduledAnnotationBeanPostProcessor.class)).isNotEmpty();
    }
}
