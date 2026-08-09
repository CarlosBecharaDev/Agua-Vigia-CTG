package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.domain.UmbralFijoEstrategiaConsenso;
import com.aguavigia.ctg.domain.UmbralProporcionalEstrategiaConsenso;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConsensoConfigTest {

    private final ConsensoConfig config = new ConsensoConfig();

    @Test
    void debeElegirLaEstrategiaFijaPorConfiguracion() {
        var estrategia = config.estrategiaConsenso("fijo", 5, 0.001, 3);

        assertThat(estrategia).isInstanceOf(UmbralFijoEstrategiaConsenso.class);
    }

    @Test
    void debeElegirLaEstrategiaProporcionalPorConfiguracion() {
        var estrategia = config.estrategiaConsenso("proporcional", 5, 0.001, 3);

        assertThat(estrategia).isInstanceOf(UmbralProporcionalEstrategiaConsenso.class);
    }

    @Test
    void debeRechazarUnNombreDeEstrategiaDesconocido() {
        assertThatThrownBy(() -> config.estrategiaConsenso("no-existe", 5, 0.001, 3))
                .isInstanceOf(IllegalStateException.class);
    }
}
