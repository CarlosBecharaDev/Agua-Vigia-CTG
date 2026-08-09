package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CorteAguaTest {

    private final Instant inicio = Instant.parse("2026-08-07T10:00:00Z");

    @Test
    void debeConstruirCorteValido() {
        CorteAgua corte = CorteAgua.builder()
                .id(new CorteId("corte-1"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .causa("Mantenimiento planta El Bosque")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .build();

        assertThat(corte.estado()).isEqualTo(EstadoCorte.ANUNCIADO);
        assertThat(corte.ventana().estaCerrada()).isFalse();
    }

    @Test
    void debeRechazarCorteConFinAnteriorAlInicio() {
        var builder = CorteAgua.builder()
                .id(new CorteId("corte-2"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.minus(1, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR);

        assertThatThrownBy(builder::build).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarCorteSinSectoresAfectados() {
        var builder = CorteAgua.builder()
                .id(new CorteId("corte-3"))
                .inicio(inicio)
                .finPrometido(inicio.plus(1, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR);

        assertThatThrownBy(builder::build).isInstanceOf(IllegalStateException.class);
    }
}
