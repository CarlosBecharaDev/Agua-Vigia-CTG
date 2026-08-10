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

    @Test
    void debeRechazarUnCorteRestablecidoSinFinReal() {
        var builder = CorteAgua.builder()
                .id(new CorteId("corte-4"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(EstadoCorte.RESTABLECIDO);

        assertThatThrownBy(builder::build).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void debeRechazarUnCorteAnunciadoConFinRealYaPuesto() {
        var builder = CorteAgua.builder()
                .id(new CorteId("corte-5"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .finReal(inicio.plus(5, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(EstadoCorte.ANUNCIADO);

        assertThatThrownBy(builder::build).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void debeCerrarUnCorteAbiertoYQuedarCoherente() {
        CorteAgua corte = CorteAgua.builder()
                .id(new CorteId("corte-6"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .build();

        Instant finReal = inicio.plus(5, ChronoUnit.HOURS);
        CorteAgua cerrado = corte.cerrar(finReal);

        assertThat(cerrado.estado()).isEqualTo(EstadoCorte.RESTABLECIDO);
        assertThat(cerrado.ventana().finReal()).isEqualTo(finReal);
        assertThat(cerrado.ventana().estaCerrada()).isTrue();
    }

    @Test
    void debeRechazarCerrarUnCorteYaCerrado() {
        CorteAgua corte = CorteAgua.builder()
                .id(new CorteId("corte-7"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .finReal(inicio.plus(5, ChronoUnit.HOURS))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(EstadoCorte.RESTABLECIDO)
                .build();

        assertThatThrownBy(() -> corte.cerrar(inicio.plus(6, ChronoUnit.HOURS)))
                .isInstanceOf(IllegalStateException.class);
    }
}
