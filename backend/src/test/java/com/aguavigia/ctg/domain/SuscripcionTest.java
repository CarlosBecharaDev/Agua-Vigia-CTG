package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SuscripcionTest {

    private static final CorreoElectronico CORREO = new CorreoElectronico("vecino@correo.com");
    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Test
    void debeCrearseEnPendienteConfirmacionConUnSector() {
        Suscripcion suscripcion = new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION, "token-1", AHORA);

        assertThat(suscripcion.estado()).isEqualTo(EstadoSuscripcion.PENDIENTE_CONFIRMACION);
        assertThat(suscripcion.sectorIds()).containsExactly(new SectorId("bocagrande"));
    }

    @Test
    void debeRechazarSuscripcionSinSectores() {
        assertThatThrownBy(() -> new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION, "token-1", AHORA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarSuscripcionSinTokenDeConfirmacion() {
        assertThatThrownBy(() -> new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION, " ", AHORA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarSuscripcionSinCorreo() {
        assertThatThrownBy(() -> new Suscripcion(
                new SuscripcionId("s1"), null, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION, "token-1", AHORA))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void confirmarDebeCambiarElEstadoAConfirmada() {
        Suscripcion pendiente = new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION, "token-1", AHORA);

        assertThat(pendiente.confirmar().estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
    }

    @Test
    void confirmarDebeSerIdempotenteSiYaEstabaConfirmada() {
        Suscripcion confirmada = new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CONFIRMADA, "token-1", AHORA);

        assertThat(confirmada.confirmar().estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
    }

    @Test
    void confirmarDebeRechazarUnaSuscripcionYaCancelada() {
        Suscripcion cancelada = new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CANCELADA, "token-1", AHORA);

        assertThatThrownBy(cancelada::confirmar).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void cancelarDebeCambiarElEstadoACanceladaDesdeCualquierEstado() {
        Suscripcion confirmada = new Suscripcion(
                new SuscripcionId("s1"), CORREO, List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CONFIRMADA, "token-1", AHORA);

        assertThat(confirmada.cancelar().estado()).isEqualTo(EstadoSuscripcion.CANCELADA);
    }
}
