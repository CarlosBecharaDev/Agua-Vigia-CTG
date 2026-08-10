package com.aguavigia.ctg.infrastructure.mantenimiento;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentCaptor.forClass;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class PurgaEvidenciaAntiguaJobTest {

    private static final Instant AHORA = Instant.parse("2026-08-10T12:00:00Z");

    private AlmacenamientoPort almacenamiento;
    private ReporteCiudadanoRepository reportes;
    private PurgaEvidenciaAntiguaJob job;

    @BeforeEach
    void montar() {
        almacenamiento = mock(AlmacenamientoPort.class);
        reportes = mock(ReporteCiudadanoRepository.class);
    }

    private void conPropiedades(MantenimientoProperties.RetencionEvidencia retencion) {
        RelojPort reloj = () -> AHORA;
        job = new PurgaEvidenciaAntiguaJob(almacenamiento, reportes, reloj,
                new MantenimientoProperties(null, retencion));
    }

    private ReporteCiudadano reporteConFoto(String id, String fotoUrl) {
        return new ReporteCiudadano(new ReporteId(id), new SectorId("manga"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-" + id), AHORA.minus(Duration.ofDays(400)),
                com.aguavigia.ctg.domain.EstadoModeracion.APROBADO, fotoUrl);
    }

    @Test
    void debeBorrarElArchivoYLimpiarLaFotoUrlDeCadaReporteVencido() {
        conPropiedades(new MantenimientoProperties.RetencionEvidencia(true, 365));
        given(reportes.listarConFotoAnterioresA(AHORA.minus(Duration.ofDays(365))))
                .willReturn(List.of(reporteConFoto("r1", "/fotos/vieja.jpg")));

        job.purgar();

        verify(almacenamiento).eliminar("vieja.jpg");
        var captor = forClass(ReporteCiudadano.class);
        verify(reportes).guardar(captor.capture());
        assertThat(captor.getValue().fotoUrl()).isNull();
        assertThat(captor.getValue().id().valor()).isEqualTo("r1");
    }

    @Test
    void noDebeHacerNadaSiElJobEstaDeshabilitado() {
        conPropiedades(new MantenimientoProperties.RetencionEvidencia(false, 365));

        job.purgar();

        verify(reportes, never()).listarConFotoAnterioresA(any());
        verify(almacenamiento, never()).eliminar(any());
    }
}
