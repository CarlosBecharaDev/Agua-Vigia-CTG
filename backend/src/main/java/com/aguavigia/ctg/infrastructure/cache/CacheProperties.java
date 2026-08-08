package com.aguavigia.ctg.infrastructure.cache;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.Map;

/**
 * `aguavigia.cache` en application.yml. A diferencia de `RateLimitProperties`, aqui SI hay un
 * valor por defecto (30s): un cache sin TTL crece sin control y contradice DESIGN.md §6
 * ("frescura siempre visible") — un dato cacheado indefinidamente dejaria de reflejar cambios
 * reales del acueducto.
 *
 * Ejemplo para acortar el TTL de un cache especifico:
 * <pre>
 * aguavigia:
 *   cache:
 *     ttl-por-defecto-segundos: 30
 *     ttl-segundos-por-cache:
 *       sectores: 15
 * </pre>
 */
@ConfigurationProperties(prefix = "aguavigia.cache")
public record CacheProperties(
        @DefaultValue("30") int ttlPorDefectoSegundos,
        Map<String, Integer> ttlSegundosPorCache) {

    public CacheProperties {
        if (ttlPorDefectoSegundos <= 0) {
            throw new IllegalArgumentException(
                    "aguavigia.cache.ttl-por-defecto-segundos debe ser mayor que cero");
        }
        ttlSegundosPorCache = ttlSegundosPorCache == null ? Map.of() : Map.copyOf(ttlSegundosPorCache);
    }
}
