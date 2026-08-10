package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventoBitacoraFactoryTest {

    private final Instant inicio = Instant.parse("2026-08-09T10:00:00Z");
    private final Instant ahora = inicio.plus(1, ChronoUnit.HOURS);

    private CorteAgua corte() {
        return CorteAgua.builder()
                .id(new CorteId("corte-1"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(6, ChronoUnit.HOURS))
                .causa("Mantenimiento planta El Bosque")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .build();
    }

    @Test
    void debeCrearElEventoDeCorteAnunciado() {
        CorteAgua corte = corte();
        SectorId sectorId = new SectorId("manga");

        EventoBitacora evento = EventoBitacoraFactory.corteAnunciado(corte, sectorId, ahora);

        assertThat(evento.tipo()).isEqualTo(TipoEvento.CORTE_ANUNCIADO);
        assertThat(evento.sectorId()).isEqualTo(sectorId);
        assertThat(evento.corteId()).isEqualTo(corte.id());
        assertThat(evento.timestamp()).isEqualTo(ahora);
        assertThat(evento.descripcion()).contains("manga").contains(corte.causa());
    }

    @Test
    void debeCrearElEventoDeCorteRestablecido() {
        CorteAgua corte = corte();
        SectorId sectorId = new SectorId("manga");

        EventoBitacora evento = EventoBitacoraFactory.corteRestablecido(corte, sectorId, ahora);

        assertThat(evento.tipo()).isEqualTo(TipoEvento.CORTE_RESTABLECIDO);
        assertThat(evento.sectorId()).isEqualTo(sectorId);
        assertThat(evento.corteId()).isEqualTo(corte.id());
        assertThat(evento.timestamp()).isEqualTo(ahora);
        assertThat(evento.descripcion()).contains("manga");
    }

    @Test
    void debeCrearElEventoDeConsensoConfirmadoSinCorteAsociado() {
        SectorId sectorId = new SectorId("bocagrande");

        EventoBitacora evento = EventoBitacoraFactory.consensoConfirmado(
                sectorId, EstadoServicio.SIN_SERVICIO, 5, ahora);

        assertThat(evento.tipo()).isEqualTo(TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS);
        assertThat(evento.sectorId()).isEqualTo(sectorId);
        assertThat(evento.corteId()).isNull();
        assertThat(evento.timestamp()).isEqualTo(ahora);
        assertThat(evento.descripcion()).contains("5").contains("bocagrande").contains("SIN_SERVICIO");
    }
}
