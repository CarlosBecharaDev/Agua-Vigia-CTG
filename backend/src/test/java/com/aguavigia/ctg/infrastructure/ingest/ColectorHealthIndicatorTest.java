package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/** RNF007 — la salud de los colectores llega a /actuator/health. */
class ColectorHealthIndicatorTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private EstadoColectorRegistry registro;
    private ColectorHealthIndicator indicador;

    @BeforeEach
    void montar() {
        registro = new EstadoColectorRegistry(() -> AHORA);
        indicador = new ColectorHealthIndicator(registro);
    }

    /** Un pipeline que aún no ha corrido no está roto: está sin estrenar. */
    @Test
    void debeReportarseArribaCuandoNingunColectorHaCorridoTodavia() {
        assertThat(indicador.health().getStatus()).isEqualTo(Status.UP);
    }

    @Test
    void debeReportarseArribaConLosDetallesDeCadaColector() {
        registro.registrarExito("acuacar", 7);

        Health salud = indicador.health();

        assertThat(salud.getStatus()).isEqualTo(Status.UP);
        assertThat(salud.getDetails()).containsKey("acuacar");
    }

    @Test
    void unFalloAisladoNoDebeTumbarLaSalud() {
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");

        assertThat(indicador.health().getStatus()).isEqualTo(Status.UP);
    }

    @Test
    void tresFallosConsecutivosDebenReportarElServicioDegradado() {
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");

        assertThat(indicador.health().getStatus()).isEqualTo(Status.DOWN);
    }

    @Test
    void unColectorSanoNoDebeSalvarAOtroCaido() {
        registro.registrarExito("rss", 3);
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");

        assertThat(indicador.health().getStatus()).isEqualTo(Status.DOWN);
    }

    @Test
    void unExitoPosteriorDebeDevolverLaSaludAArriba() {
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");
        registro.registrarFallo("acuacar", "503");
        assertThat(indicador.health().getStatus()).isEqualTo(Status.DOWN);

        registro.registrarExito("acuacar", 1);

        assertThat(indicador.health().getStatus()).isEqualTo(Status.UP);
    }

    @Test
    void laTasaDeErrorDebeContarCiclosFallidosSobreElTotal() {
        registro.registrarExito("acuacar", 5);
        registro.registrarExito("acuacar", 5);
        registro.registrarFallo("acuacar", "503");

        EstadoColector estado = registro.estados().getFirst();
        assertThat(estado.tasaDeError()).isCloseTo(1.0 / 3, org.assertj.core.data.Offset.offset(0.0001));
        assertThat(estado.itemsProcesados()).isEqualTo(10);
        assertThat(estado.ultimaEjecucionExitosa()).isEqualTo(AHORA);
    }
}
