package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EstrategiaConsenso;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.ResultadoConsenso;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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

class EvaluarConsensoServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");
    private static final SectorId SECTOR_ID = new SectorId("bocagrande");

    private SectorRepository sectores;
    private ReporteCiudadanoRepository reportes;
    private ContadorReportesPort contadorReportes;
    private EstrategiaConsenso estrategia;
    private RegistrarEventoBitacoraUseCase registrarEvento;
    private RelojPort reloj;
    private SuscripcionRepository suscripciones;
    private NotificacionPort notificador;

    private EvaluarConsensoService servicio;

    @BeforeEach
    void montar() {
        sectores = mock(SectorRepository.class);
        reportes = mock(ReporteCiudadanoRepository.class);
        contadorReportes = mock(ContadorReportesPort.class);
        estrategia = mock(EstrategiaConsenso.class);
        registrarEvento = mock(RegistrarEventoBitacoraUseCase.class);
        reloj = mock(RelojPort.class);
        suscripciones = mock(SuscripcionRepository.class);
        notificador = mock(NotificacionPort.class);

        given(reloj.ahora()).willReturn(AHORA);
        servicio = new EvaluarConsensoService(
                sectores, reportes, contadorReportes, estrategia, registrarEvento, reloj, suscripciones, notificador, 30);
    }

    private ReporteCiudadano reporte(String id, TipoReporte tipo) {
        return new ReporteCiudadano(new ReporteId(id), SECTOR_ID, tipo, null, new HuellaDispositivo("h-" + id), AHORA);
    }

    @Test
    void debeCambiarElEstadoYAnexarUnEventoCuandoSeAlcanzaElConsenso() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.CON_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(3L);
        given(estrategia.seAlcanzaConsenso(3L, sector)).willReturn(true);
        given(reportes.listarRecientesPorSector(any(), any())).willReturn(List.of(
                reporte("r1", TipoReporte.SIN_AGUA), reporte("r2", TipoReporte.SIN_AGUA), reporte("r3", TipoReporte.SIN_AGUA)));

        ResultadoConsenso resultado = servicio.evaluar(SECTOR_ID);

        assertThat(resultado.alcanzado()).isTrue();
        assertThat(resultado.nuevoEstado()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(resultado.reportesQueSustentan()).containsExactly(
                new ReporteId("r1"), new ReporteId("r2"), new ReporteId("r3"));
        verify(sectores).guardar(sector.conEstado(EstadoServicio.SIN_SERVICIO));
        verify(registrarEvento).registrar(any(EventoBitacora.class));
    }

    @Test
    void debeAnexarElEventoConElTipoDeConsensoCiudadano() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.CON_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(3L);
        given(estrategia.seAlcanzaConsenso(3L, sector)).willReturn(true);
        given(reportes.listarRecientesPorSector(any(), any())).willReturn(List.of(
                reporte("r1", TipoReporte.SIN_AGUA), reporte("r2", TipoReporte.SIN_AGUA)));

        servicio.evaluar(SECTOR_ID);

        var captor = org.mockito.ArgumentCaptor.forClass(EventoBitacora.class);
        verify(registrarEvento).registrar(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS);
        assertThat(captor.getValue().sectorId()).isEqualTo(SECTOR_ID);
    }

    @Test
    void debeDevolverNoAlcanzadoSiLaEstrategiaLoRechaza() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.CON_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(1L);
        given(estrategia.seAlcanzaConsenso(1L, sector)).willReturn(false);

        ResultadoConsenso resultado = servicio.evaluar(SECTOR_ID);

        assertThat(resultado.alcanzado()).isFalse();
        assertThat(resultado.nuevoEstado()).isNull();
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void noDebeDuplicarElEventoSiElEstadoNoCambia() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(3L);
        given(estrategia.seAlcanzaConsenso(3L, sector)).willReturn(true);
        given(reportes.listarRecientesPorSector(any(), any())).willReturn(List.of(
                reporte("r1", TipoReporte.SIN_AGUA), reporte("r2", TipoReporte.SIN_AGUA)));

        ResultadoConsenso resultado = servicio.evaluar(SECTOR_ID);

        assertThat(resultado.alcanzado()).isFalse();
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeElegirElEstadoPorMayoriaDeTiposDeReporte() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.CON_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(3L);
        given(estrategia.seAlcanzaConsenso(3L, sector)).willReturn(true);
        given(reportes.listarRecientesPorSector(any(), any())).willReturn(List.of(
                reporte("r1", TipoReporte.PRESION_BAJA),
                reporte("r2", TipoReporte.SIN_AGUA),
                reporte("r3", TipoReporte.SIN_AGUA)));

        ResultadoConsenso resultado = servicio.evaluar(SECTOR_ID);

        assertThat(resultado.nuevoEstado()).isEqualTo(EstadoServicio.SIN_SERVICIO);
    }

    @Test
    void debeMantenerElEstadoActualSiHayEmpateEntreTiposDeReporte() {
        Sector sector = new Sector(SECTOR_ID, "BOCAGRANDE", 12000, EstadoServicio.CON_SERVICIO);
        given(sectores.buscarPorId(SECTOR_ID)).willReturn(Optional.of(sector));
        given(contadorReportes.contarRecientes(any(), any())).willReturn(2L);
        given(estrategia.seAlcanzaConsenso(2L, sector)).willReturn(true);
        given(reportes.listarRecientesPorSector(any(), any())).willReturn(List.of(
                reporte("r1", TipoReporte.SIN_AGUA), reporte("r2", TipoReporte.SERVICIO_RESTABLECIDO)));

        ResultadoConsenso resultado = servicio.evaluar(SECTOR_ID);

        assertThat(resultado.alcanzado()).isFalse();
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeRechazarSiElSectorNoExiste() {
        given(sectores.buscarPorId(new SectorId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.evaluar(new SectorId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
