package com.aguavigia.ctg.infrastructure.cache;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * estado-del-backend.md #6.1 — `infrastructure.cache` era el paquete de menor cobertura tras la
 * limpieza (69.6%): la validación de esta clase (el TTL por defecto y el mapa nulo) no tenía
 * ninguna prueba propia, solo la ejercitaba indirectamente CacheConfigTest con valores válidos.
 */
class CachePropertiesTest {

    @Test
    void debeAceptarUnTtlPorDefectoPositivoSinOverrides() {
        CacheProperties propiedades = new CacheProperties(30, null);

        assertThat(propiedades.ttlPorDefectoSegundos()).isEqualTo(30);
        assertThat(propiedades.ttlSegundosPorCache()).isEmpty();
    }

    @Test
    void debeConservarLosOverridesPorCache() {
        CacheProperties propiedades = new CacheProperties(30, Map.of("sectores", 15));

        assertThat(propiedades.ttlSegundosPorCache()).containsEntry("sectores", 15);
    }

    @Test
    void debeRechazarUnTtlPorDefectoEnCero() {
        assertThatThrownBy(() -> new CacheProperties(0, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ttl-por-defecto-segundos");
    }

    @Test
    void debeRechazarUnTtlPorDefectoNegativo() {
        assertThatThrownBy(() -> new CacheProperties(-1, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /** Un mapa nulo (sin overrides en application.yml) no debe romper la construcción. */
    @Test
    void unMapaDeOverridesNuloDebeQuedarComoMapaVacioNoComoNulo() {
        CacheProperties propiedades = new CacheProperties(30, null);

        assertThat(propiedades.ttlSegundosPorCache()).isNotNull().isEmpty();
    }
}
