package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
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

class ConfirmarReporteServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private ReporteCiudadanoRepository reportes;
    private EvaluarConsensoUseCase evaluarConsenso;
    private ConfirmarReporteService servicio;

    @BeforeEach
    void montar() {
        reportes = mock(ReporteCiudadanoRepository.class);
        evaluarConsenso = mock(EvaluarConsensoUseCase.class);
        servicio = new ConfirmarReporteService(reportes, evaluarConsenso);

        given(reportes.guardar(any(ReporteCiudadano.class))).willAnswer(invocacion -> invocacion.getArgument(0));
    }

    private ReporteCiudadano reporteOriginal() {
        return new ReporteCiudadano(new ReporteId("r1"), new SectorId("manga"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-autor"), AHORA);
    }

    @Test
    void debeAgregarLaHuellaDeQuienConfirmaYReevaluarElConsenso() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reporteOriginal()));

        ReporteCiudadano confirmado = servicio.confirmar(new ReporteId("r1"), new HuellaDispositivo("hash-vecino"));

        assertThat(confirmado.numeroConfirmaciones()).isEqualTo(1);
        verify(reportes).guardar(confirmado);
        verify(evaluarConsenso).evaluar(new SectorId("manga"));
    }

    @Test
    void debeRechazarConfirmarUnReporteQueNoExiste() {
        given(reportes.buscarPorId(new ReporteId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.confirmar(new ReporteId("no-existe"), new HuellaDispositivo("hash-vecino")))
                .isInstanceOf(IllegalArgumentException.class);

        verify(reportes, never()).guardar(any());
        verify(evaluarConsenso, never()).evaluar(any());
    }
}
