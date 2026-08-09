package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.domain.EstrategiaConsenso;
import com.aguavigia.ctg.domain.UmbralFijoEstrategiaConsenso;
import com.aguavigia.ctg.domain.UmbralProporcionalEstrategiaConsenso;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RF010 — cuál de las dos estrategias de consenso está activa es configuración, no código: cambiar
 * de "fijo" a "proporcional" (o viceversa) no debería tocar EvaluarConsensoService.
 */
@Configuration
public class ConsensoConfig {

    @Bean
    public EstrategiaConsenso estrategiaConsenso(
            @Value("${aguavigia.consenso.estrategia:proporcional}") String estrategia,
            @Value("${aguavigia.consenso.umbral-fijo:3}") long umbralFijo,
            @Value("${aguavigia.consenso.factor-poblacion:0.001}") double factorPoblacion,
            @Value("${aguavigia.consenso.umbral-minimo:3}") long umbralMinimo) {
        return switch (estrategia) {
            case "fijo" -> new UmbralFijoEstrategiaConsenso(umbralFijo);
            case "proporcional" -> new UmbralProporcionalEstrategiaConsenso(factorPoblacion, umbralMinimo);
            default -> throw new IllegalStateException(
                    "aguavigia.consenso.estrategia debe ser 'fijo' o 'proporcional', no '" + estrategia + "'");
        };
    }
}
