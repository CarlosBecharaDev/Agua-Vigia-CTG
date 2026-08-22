package com.aguavigia.ctg.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Habilita @Scheduled — lo usa PipelineOrquestador para el ciclo de ingesta (M9). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
