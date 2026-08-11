package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PropuestaIngestaTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private PropuestaIngesta propuesta() {
        return new PropuestaIngesta(
                new PropuestaId("p-1"), new SectorId("manga"), EstadoServicio.SIN_SERVICIO,
                "acuacar", "https://acuacar.com/x", "cita", 0.6, AHORA);
    }

    @Test
    void debeNacerPendienteDeRevision() {
        assertThat(propuesta().estadoRevision()).isEqualTo(EstadoRevision.PENDIENTE);
    }

    @Test
    void aprobarYDescartarNoDebenMutarLaOriginal() {
        PropuestaIngesta original = propuesta();

        assertThat(original.aprobar().estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        assertThat(original.descartar().estadoRevision()).isEqualTo(EstadoRevision.DESCARTADA);
        assertThat(original.estadoRevision()).isEqualTo(EstadoRevision.PENDIENTE);
    }

    @Test
    void aprobarDebeSerIdempotente() {
        assertThat(propuesta().aprobar().aprobar().estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
    }

    @Test
    void debeExigirSectorEstadoFuenteYFecha() {
        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), null,
                EstadoServicio.SIN_SERVICIO, "acuacar", null, "cita", 0.6, AHORA))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                null, "acuacar", null, "cita", 0.6, AHORA))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                EstadoServicio.SIN_SERVICIO, "  ", null, "cita", 0.6, AHORA))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                EstadoServicio.SIN_SERVICIO, "acuacar", null, "cita", 0.6, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /** La confianza decide si algo puede publicarse solo: fuera de [0,1] no significa nada. */
    @Test
    void debeRechazarUnaConfianzaFueraDeRango() {
        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                EstadoServicio.SIN_SERVICIO, "acuacar", null, "cita", 1.4, AHORA))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                EstadoServicio.SIN_SERVICIO, "acuacar", null, "cita", -0.1, AHORA))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
