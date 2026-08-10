package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.LimiteReportesExcedidoException;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.ResultadoConsenso;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RegistrarReporteServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");
    private static final HuellaDispositivo HUELLA = new HuellaDispositivo("hash-1");
    private static final int LIMITE = 3;

    private SectorRepository sectores;
    private ReporteCiudadanoRepository reportes;
    private ContadorReportesPort contadorReportes;
    private EvaluarConsensoUseCase evaluarConsenso;
    private RegistrarReporteService servicio;

    @BeforeEach
    void montar() {
        sectores = mock(SectorRepository.class);
        reportes = mock(ReporteCiudadanoRepository.class);
        contadorReportes = mock(ContadorReportesPort.class);
        evaluarConsenso = mock(EvaluarConsensoUseCase.class);
        RelojPort reloj = () -> AHORA;
        servicio = new RegistrarReporteService(sectores, reportes, contadorReportes, evaluarConsenso, reloj, LIMITE, 30);

        given(reportes.guardar(any(ReporteCiudadano.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
        given(reportes.contarRecientesPorSectorYDispositivo(any(), any(), any())).willReturn(0L);
        given(evaluarConsenso.evaluar(any()))
                .willReturn(new ResultadoConsenso(new SectorId("bocagrande"), false, null, List.of()));
    }

    @Test
    void debeRegistrarElReporteYAlimentarElContador() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.of(bocagrande));

        ReporteCiudadano reporte = servicio.registrar(
                new SectorId("bocagrande"), TipoReporte.SIN_AGUA, new Coordenada(10.39, -75.48), HUELLA);

        assertThat(reporte.tipo()).isEqualTo(TipoReporte.SIN_AGUA);
        assertThat(reporte.timestamp()).isEqualTo(AHORA);
        verify(contadorReportes).registrar(new SectorId("bocagrande"), HUELLA);
        verify(evaluarConsenso).evaluar(new SectorId("bocagrande"));
    }

    @Test
    void debeAceptarUnReporteSinCoordenada() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.of(bocagrande));

        ReporteCiudadano reporte = servicio.registrar(
                new SectorId("bocagrande"), TipoReporte.PRESION_BAJA, null, HUELLA);

        assertThat(reporte.coordenada()).isNull();
    }

    @Test
    void debeRechazarElReporteSiElSectorNoExiste() {
        given(sectores.buscarPorId(new SectorId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.registrar(new SectorId("no-existe"), TipoReporte.SIN_AGUA, null, HUELLA))
                .isInstanceOf(IllegalArgumentException.class);

        verify(reportes, never()).guardar(any());
        verify(contadorReportes, never()).registrar(any(), any());
        verify(evaluarConsenso, never()).evaluar(any());
    }

    @Test
    void debeRechazarElReporteCuandoElDispositivoAlcanzaElLimite() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.of(bocagrande));
        given(reportes.contarRecientesPorSectorYDispositivo(new SectorId("bocagrande"), Duration.ofMinutes(30), HUELLA))
                .willReturn(3L);

        assertThatThrownBy(() -> servicio.registrar(new SectorId("bocagrande"), TipoReporte.SIN_AGUA, null, HUELLA))
                .isInstanceOf(LimiteReportesExcedidoException.class);

        verify(reportes, never()).guardar(any());
        verify(contadorReportes, never()).registrar(any(), any());
        verify(evaluarConsenso, never()).evaluar(any());
    }

    @Test
    void noDebeContarReportesDeOtroDispositivoParaElLimite() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.of(bocagrande));
        HuellaDispositivo otroDispositivo = new HuellaDispositivo("hash-otro");
        given(reportes.contarRecientesPorSectorYDispositivo(new SectorId("bocagrande"), Duration.ofMinutes(30), otroDispositivo))
                .willReturn(3L);

        ReporteCiudadano reporte = servicio.registrar(new SectorId("bocagrande"), TipoReporte.SIN_AGUA, null, HUELLA);

        assertThat(reporte).isNotNull();
        verify(contadorReportes).registrar(new SectorId("bocagrande"), HUELLA);
    }
}
