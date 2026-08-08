package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SectorTest {

    @Test
    void debeAceptarPoblacionNula() {
        Sector sector = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", null, EstadoServicio.CON_SERVICIO);

        assertThat(sector.poblacion()).isNull();
    }

    @Test
    void debeRechazarNombreEnBlanco() {
        assertThatThrownBy(() -> new Sector(new SectorId("x"), " ", 1000, EstadoServicio.CON_SERVICIO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarPoblacionNegativa() {
        assertThatThrownBy(() -> new Sector(new SectorId("x"), "MANGA", -1, EstadoServicio.CON_SERVICIO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void conEstadoDebeDevolverUnSectorNuevoSinMutarElOriginal() {
        Sector original = new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.CON_SERVICIO);

        Sector actualizado = original.conEstado(EstadoServicio.SIN_SERVICIO);

        assertThat(original.estadoActual()).isEqualTo(EstadoServicio.CON_SERVICIO);
        assertThat(actualizado.estadoActual()).isEqualTo(EstadoServicio.SIN_SERVICIO);
    }
}
