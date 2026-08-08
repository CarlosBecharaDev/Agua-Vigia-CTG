package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VentanaTiempoTest {

    private final Instant inicio = Instant.parse("2026-08-07T10:00:00Z");

    @Test
    void debeAceptarVentanaValida() {
        Instant finPrometido = inicio.plus(2, ChronoUnit.HOURS);

        VentanaTiempo ventana = new VentanaTiempo(inicio, finPrometido);

        assertThat(ventana.estaCerrada()).isFalse();
    }

    @Test
    void debeRechazarFinPrometidoAnteriorAlInicio() {
        Instant finPrometido = inicio.minus(1, ChronoUnit.HOURS);

        assertThatThrownBy(() -> new VentanaTiempo(inicio, finPrometido))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarFinPrometidoIgualAlInicio() {
        assertThatThrownBy(() -> new VentanaTiempo(inicio, inicio))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarFinRealAnteriorAlInicio() {
        Instant finPrometido = inicio.plus(2, ChronoUnit.HOURS);
        Instant finReal = inicio.minus(10, ChronoUnit.MINUTES);

        assertThatThrownBy(() -> new VentanaTiempo(inicio, finPrometido, finReal))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeQuedarCerradaCuandoTieneFinReal() {
        Instant finPrometido = inicio.plus(2, ChronoUnit.HOURS);
        Instant finReal = inicio.plus(90, ChronoUnit.MINUTES);

        VentanaTiempo ventana = new VentanaTiempo(inicio, finPrometido, finReal);

        assertThat(ventana.estaCerrada()).isTrue();
    }
}
