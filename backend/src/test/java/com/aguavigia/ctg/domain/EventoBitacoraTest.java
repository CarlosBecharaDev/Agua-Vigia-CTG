package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EventoBitacoraTest {

    @Test
    void debeCrearEventoValido() {
        var evento = new EventoBitacora(
                new EventoId("ev-123"),
                TipoEvento.CORTE_ANUNCIADO,
                new SectorId("sec-1"),
                new CorteId("corte-1"),
                Instant.now(),
                "Descripción válida"
        );

        assertThat(evento.tipo()).isEqualTo(TipoEvento.CORTE_ANUNCIADO);
        assertThat(evento.descripcion()).isEqualTo("Descripción válida");
    }

    @Test
    void debeRechazarTipoNulo() {
        assertThatThrownBy(() -> new EventoBitacora(
                new EventoId("ev-123"),
                null,
                new SectorId("sec-1"),
                null,
                Instant.now(),
                "Descripción"
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El evento debe tener un tipo");
    }

    @Test
    void debeRechazarTimestampNulo() {
        assertThatThrownBy(() -> new EventoBitacora(
                new EventoId("ev-123"),
                TipoEvento.CORTE_ANUNCIADO,
                new SectorId("sec-1"),
                null,
                null,
                "Descripción"
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El evento debe tener timestamp");
    }

    @Test
    void debeRechazarDescripcionNulaOEnBlanco() {
        assertThatThrownBy(() -> new EventoBitacora(
                new EventoId("ev-123"),
                TipoEvento.CORTE_ANUNCIADO,
                new SectorId("sec-1"),
                null,
                Instant.now(),
                null
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El evento debe tener descripción");

        assertThatThrownBy(() -> new EventoBitacora(
                new EventoId("ev-123"),
                TipoEvento.CORTE_ANUNCIADO,
                new SectorId("sec-1"),
                null,
                Instant.now(),
                "   "
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("El evento debe tener descripción");
    }
}
