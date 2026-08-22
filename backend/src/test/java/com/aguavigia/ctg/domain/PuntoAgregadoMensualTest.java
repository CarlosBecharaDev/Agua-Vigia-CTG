package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PuntoAgregadoMensualTest {

    private static final AgregadoDuraciones AGREGADO =
            new AgregadoDuraciones(Duration.ofHours(2), Duration.ofHours(4), 1);

    @Test
    void debeConstruirseConPeriodoYAgregadoValidos() {
        PuntoAgregadoMensual punto = new PuntoAgregadoMensual(YearMonth.of(2026, 8), AGREGADO);

        assertThat(punto.periodo()).isEqualTo(YearMonth.of(2026, 8));
        assertThat(punto.agregado()).isEqualTo(AGREGADO);
    }

    @Test
    void debeRechazarPeriodoNulo() {
        assertThatThrownBy(() -> new PuntoAgregadoMensual(null, AGREGADO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarAgregadoNulo() {
        assertThatThrownBy(() -> new PuntoAgregadoMensual(YearMonth.of(2026, 8), null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
