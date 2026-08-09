package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class GestionarCorteOficialServiceTest {

    private static final Instant INICIO = Instant.parse("2026-08-09T10:00:00Z");

    private CorteAguaRepository cortes;
    private SectorRepository sectores;
    private GestionarCorteOficialService servicio;

    @BeforeEach
    void montar() {
        cortes = mock(CorteAguaRepository.class);
        sectores = mock(SectorRepository.class);
        servicio = new GestionarCorteOficialService(cortes, sectores);

        given(cortes.guardar(any(CorteAgua.class))).willAnswer(invocacion -> invocacion.getArgument(0));
    }

    private CorteAgua corte(EstadoCorte estado, Instant finReal) {
        return CorteAgua.builder()
                .id(new CorteId("corte-1"))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(INICIO)
                .finPrometido(INICIO.plus(6, ChronoUnit.HOURS))
                .finReal(finReal)
                .causa("Mantenimiento planta El Bosque")
                .origen(OrigenCorte.VEEDOR)
                .estado(estado)
                .build();
    }

    @Test
    void debeRegistrarUnCorteCuandoTodosLosSectoresExisten() {
        given(sectores.buscarPorId(new SectorId("manga")))
                .willReturn(Optional.of(new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.SIN_SERVICIO)));

        CorteAgua guardado = servicio.registrar(corte(EstadoCorte.ANUNCIADO, null));

        assertThat(guardado.estado()).isEqualTo(EstadoCorte.ANUNCIADO);
        verify(cortes).guardar(any(CorteAgua.class));
    }

    @Test
    void debeRechazarElRegistroSiAlgunSectorNoExiste() {
        given(sectores.buscarPorId(new SectorId("manga"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.registrar(corte(EstadoCorte.ANUNCIADO, null)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(cortes, never()).guardar(any());
    }

    @Test
    void debeCerrarUnCorteAbiertoConLaHoraReal() {
        given(cortes.buscarPorId(new CorteId("corte-1"))).willReturn(Optional.of(corte(EstadoCorte.CONFIRMADO, null)));
        Instant finReal = INICIO.plus(5, ChronoUnit.HOURS);

        CorteAgua cerrado = servicio.cerrar(new CorteId("corte-1"), finReal);

        assertThat(cerrado.estado()).isEqualTo(EstadoCorte.RESTABLECIDO);
        assertThat(cerrado.ventana().finReal()).isEqualTo(finReal);
    }

    @Test
    void debeRechazarCerrarUnCorteQueNoExiste() {
        given(cortes.buscarPorId(new CorteId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.cerrar(new CorteId("no-existe"), INICIO))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarCerrarUnCorteYaCerrado() {
        Instant finRealPrevio = INICIO.plus(4, ChronoUnit.HOURS);
        given(cortes.buscarPorId(new CorteId("corte-1")))
                .willReturn(Optional.of(corte(EstadoCorte.RESTABLECIDO, finRealPrevio)));

        assertThatThrownBy(() -> servicio.cerrar(new CorteId("corte-1"), INICIO.plus(5, ChronoUnit.HOURS)))
                .isInstanceOf(IllegalStateException.class);

        verify(cortes, never()).guardar(any());
    }
}
