package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CoordenadaTest {

    @Test
    void debeAceptarCoordenadaValidaDeCartagena() {
        Coordenada coordenada = new Coordenada(10.3910, -75.4794);

        assertThat(coordenada.latitud()).isEqualTo(10.3910);
        assertThat(coordenada.longitud()).isEqualTo(-75.4794);
    }

    @Test
    void debeRechazarLatitudFueraDeRango() {
        assertThatThrownBy(() -> new Coordenada(91, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarLongitudFueraDeRango() {
        assertThatThrownBy(() -> new Coordenada(0, -181))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
