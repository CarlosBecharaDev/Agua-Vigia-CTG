package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ActualizarEstadosPorVentanaServiceTest {

    private static final SectorId MANGA = new SectorId("manga");
    private static final Instant INICIO = Instant.parse("2026-08-21T14:00:00Z");
    private static final Instant FIN = Instant.parse("2026-08-21T23:00:00Z");

    private PropuestaIngestaRepository propuestas;
    private SectorRepository sectores;
    private RegistrarEventoBitacoraUseCase registrarEvento;
    private RelojPort reloj;
    private ActualizarEstadosPorVentanaService servicio;

    @BeforeEach
    void montar() {
        propuestas = mock(PropuestaIngestaRepository.class);
        sectores = mock(SectorRepository.class);
        registrarEvento = mock(RegistrarEventoBitacoraUseCase.class);
        reloj = mock(RelojPort.class);
        servicio = new ActualizarEstadosPorVentanaService(propuestas, sectores, registrarEvento, reloj);
    }

    private void dadoQueHay(PropuestaIngesta propuesta, EstadoServicio estadoActualDelSector) {
        given(propuestas.listarAprobadasConVentanaVigente(any())).willReturn(List.of(propuesta));
        given(sectores.buscarPorId(MANGA))
                .willReturn(Optional.of(new Sector(MANGA, "MANGA", 1000, estadoActualDelSector)));
    }

    private static PropuestaIngesta propuestaAprobadaDeCorte() {
        return new PropuestaIngesta(
                new PropuestaId("p1"), MANGA, EstadoServicio.SIN_SERVICIO, "acuacar",
                "https://acuacar.com/2854", "cita", 0.85, INICIO.minusSeconds(3600),
                INICIO, FIN).aprobar();
    }

    @Test
    void antesDeQueEmpieceLaVentanaElBarrioDebeQuedarComoCorteProgramado() {
        given(reloj.ahora()).willReturn(INICIO.minusSeconds(1800));
        dadoQueHay(propuestaAprobadaDeCorte(), EstadoServicio.CON_SERVICIO);

        assertThat(servicio.aplicarVentanasVencidas()).isEqualTo(1);

        ArgumentCaptor<Sector> guardado = ArgumentCaptor.forClass(Sector.class);
        verify(sectores).guardar(guardado.capture());
        assertThat(guardado.getValue().estadoActual()).isEqualTo(EstadoServicio.CORTE_PROGRAMADO);
    }

    @Test
    void duranteLaVentanaElBarrioDebeQuedarSinServicio() {
        given(reloj.ahora()).willReturn(INICIO.plusSeconds(3600));
        dadoQueHay(propuestaAprobadaDeCorte(), EstadoServicio.CORTE_PROGRAMADO);

        assertThat(servicio.aplicarVentanasVencidas()).isEqualTo(1);

        ArgumentCaptor<Sector> guardado = ArgumentCaptor.forClass(Sector.class);
        verify(sectores).guardar(guardado.capture());
        assertThat(guardado.getValue().estadoActual()).isEqualTo(EstadoServicio.SIN_SERVICIO);
    }

    @Test
    void alTerminarLaVentanaElBarrioDebeVolverAConServicio() {
        given(reloj.ahora()).willReturn(FIN.plusSeconds(60));
        dadoQueHay(propuestaAprobadaDeCorte(), EstadoServicio.SIN_SERVICIO);

        assertThat(servicio.aplicarVentanasVencidas()).isEqualTo(1);

        ArgumentCaptor<Sector> guardado = ArgumentCaptor.forClass(Sector.class);
        verify(sectores).guardar(guardado.capture());
        assertThat(guardado.getValue().estadoActual()).isEqualTo(EstadoServicio.CON_SERVICIO);
    }

    /** Escribir en cada barrido dispararía correo, push y SSE por un cambio que no ocurrió. */
    @Test
    void noDebeEscribirCuandoElEstadoYaEsElQueCorresponde() {
        given(reloj.ahora()).willReturn(INICIO.plusSeconds(3600));
        dadoQueHay(propuestaAprobadaDeCorte(), EstadoServicio.SIN_SERVICIO);

        assertThat(servicio.aplicarVentanasVencidas()).isZero();

        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeAnexarElCambioALaBitacora() {
        given(reloj.ahora()).willReturn(FIN.plusSeconds(60));
        dadoQueHay(propuestaAprobadaDeCorte(), EstadoServicio.SIN_SERVICIO);

        servicio.aplicarVentanasVencidas();

        verify(registrarEvento).registrar(any());
    }

    @Test
    void noDebeTocarUnSectorQueYaNoExiste() {
        given(reloj.ahora()).willReturn(FIN.plusSeconds(60));
        given(propuestas.listarAprobadasConVentanaVigente(any()))
                .willReturn(List.of(propuestaAprobadaDeCorte()));
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.empty());

        assertThat(servicio.aplicarVentanasVencidas()).isZero();
        verify(sectores, never()).guardar(any());
    }
}
