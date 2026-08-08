package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IdentificadoresTest {

    @Test
    void sectorIdDebeRechazarValorEnBlanco() {
        assertThatThrownBy(() -> new SectorId(" ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void corteIdDebeRechazarValorNulo() {
        assertThatThrownBy(() -> new CorteId(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reporteIdDebeRechazarValorEnBlanco() {
        assertThatThrownBy(() -> new ReporteId("")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void eventoIdDebeRechazarValorEnBlanco() {
        assertThatThrownBy(() -> new EventoId("   ")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void huellaDispositivoDebeRechazarHashEnBlanco() {
        assertThatThrownBy(() -> new HuellaDispositivo("")).isInstanceOf(IllegalArgumentException.class);
    }
}
