package com.aguavigia.ctg.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class RelojConfig {

    /**
     * UTC y no la zona del servidor: los cortes se comparan entre si y con boletines de Acuacar,
     * y una diferencia de zona horaria falsearia el Indice de Cumplimiento (M6). La conversion a
     * hora de Cartagena es asunto de presentacion.
     */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
