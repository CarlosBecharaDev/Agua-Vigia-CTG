package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class ModerarReporteServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private ReporteCiudadanoRepository reportes;
    private ModerarReporteService servicio;

    @BeforeEach
    void montar() {
        reportes = mock(ReporteCiudadanoRepository.class);
        servicio = new ModerarReporteService(reportes);

        given(reportes.guardar(any(ReporteCiudadano.class))).willAnswer(invocacion -> invocacion.getArgument(0));
    }

    private ReporteCiudadano reportePendiente() {
        return new ReporteCiudadano(new ReporteId("r1"), new SectorId("manga"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-1"), AHORA);
    }

    @Test
    void debeAprobarUnReportePendiente() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reportePendiente()));

        ReporteCiudadano aprobado = servicio.aprobar(new ReporteId("r1"));

        assertThat(aprobado.estadoModeracion()).isEqualTo(EstadoModeracion.APROBADO);
    }

    @Test
    void debeDescartarUnReportePendiente() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reportePendiente()));

        ReporteCiudadano descartado = servicio.descartar(new ReporteId("r1"));

        assertThat(descartado.estadoModeracion()).isEqualTo(EstadoModeracion.DESCARTADO);
    }

    @Test
    void debePermitirCambiarDeDecisionSinFallar() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reportePendiente().aprobar()));

        ReporteCiudadano descartado = servicio.descartar(new ReporteId("r1"));

        assertThat(descartado.estadoModeracion()).isEqualTo(EstadoModeracion.DESCARTADO);
    }

    @Test
    void debeRechazarModerarUnReporteQueNoExiste() {
        given(reportes.buscarPorId(new ReporteId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.aprobar(new ReporteId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);

        verify(reportes, never()).guardar(any());
    }
}
