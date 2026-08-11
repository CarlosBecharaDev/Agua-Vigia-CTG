package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AgregadoDuracionesTest {

    @Test
    void debeConstruirseConDuracionesYCantidadValidas() {
        AgregadoDuraciones agregado = new AgregadoDuraciones(Duration.ofHours(2), Duration.ofHours(4), 3);

        assertThat(agregado.duracionPrometida()).isEqualTo(Duration.ofHours(2));
        assertThat(agregado.duracionReal()).isEqualTo(Duration.ofHours(4));
        assertThat(agregado.cantidadCortes()).isEqualTo(3);
    }

    @Test
    void vacioDebeTenerDuracionCeroYSinCortes() {
        AgregadoDuraciones vacio = AgregadoDuraciones.vacio();

        assertThat(vacio.duracionPrometida()).isEqualTo(Duration.ZERO);
        assertThat(vacio.duracionReal()).isEqualTo(Duration.ZERO);
        assertThat(vacio.cantidadCortes()).isZero();
    }

    @Test
    void debeRechazarDuracionPrometidaNula() {
        assertThatThrownBy(() -> new AgregadoDuraciones(null, Duration.ZERO, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarDuracionRealNula() {
        assertThatThrownBy(() -> new AgregadoDuraciones(Duration.ZERO, null, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarCantidadDeCortesNegativa() {
        assertThatThrownBy(() -> new AgregadoDuraciones(Duration.ZERO, Duration.ZERO, -1))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
