package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UmbralFijoEstrategiaConsensoTest {

    private static final Sector BOCAGRANDE = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, null);
    private static final Sector SIN_CENSO = new Sector(new SectorId("isla-fuerte"), "ISLA FUERTE", null, null);

    @Test
    void debeIgnorarLaPoblacionDelSector() {
        EstrategiaConsenso estrategia = new UmbralFijoEstrategiaConsenso(3);

        assertThat(estrategia.seAlcanzaConsenso(3, BOCAGRANDE)).isTrue();
        assertThat(estrategia.seAlcanzaConsenso(3, SIN_CENSO)).isTrue();
        assertThat(estrategia.seAlcanzaConsenso(2, BOCAGRANDE)).isFalse();
    }

    @Test
    void debeRechazarUnUmbralNoPositivo() {
        assertThatThrownBy(() -> new UmbralFijoEstrategiaConsenso(0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
