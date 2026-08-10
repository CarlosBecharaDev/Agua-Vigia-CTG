package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.mantenimiento.MantenimientoProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MantenimientoProperties.class)
public class MantenimientoConfig {
}
