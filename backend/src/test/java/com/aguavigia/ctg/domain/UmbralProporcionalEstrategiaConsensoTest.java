package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UmbralProporcionalEstrategiaConsensoTest {

    private static final EstrategiaConsenso ESTRATEGIA = new UmbralProporcionalEstrategiaConsenso(0.001, 3);

    @Test
    void debeExigirMasReportesEnUnSectorMasPoblado() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, null);

        assertThat(ESTRATEGIA.seAlcanzaConsenso(11, bocagrande)).isFalse();
        assertThat(ESTRATEGIA.seAlcanzaConsenso(12, bocagrande)).isTrue();
    }

    @Test
    void debeAplicarElPisoEnUnSectorPequeno() {
        Sector sectorPequeno = new Sector(new SectorId("el-socorro"), "EL SOCORRO", 500, null);

        // ceil(500 * 0.001) = 1, pero el piso es 3
        assertThat(ESTRATEGIA.seAlcanzaConsenso(2, sectorPequeno)).isFalse();
        assertThat(ESTRATEGIA.seAlcanzaConsenso(3, sectorPequeno)).isTrue();
    }

    @Test
    void debeUsarElPisoCuandoNoHayDatoCensal() {
        Sector sinCenso = new Sector(new SectorId("isla-fuerte"), "ISLA FUERTE", null, null);

        assertThat(ESTRATEGIA.seAlcanzaConsenso(2, sinCenso)).isFalse();
        assertThat(ESTRATEGIA.seAlcanzaConsenso(3, sinCenso)).isTrue();
    }

    @Test
    void debeRechazarUnFactorNoPositivo() {
        assertThatThrownBy(() -> new UmbralProporcionalEstrategiaConsenso(0, 3))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarUnUmbralMinimoNoPositivo() {
        assertThatThrownBy(() -> new UmbralProporcionalEstrategiaConsenso(0.001, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
