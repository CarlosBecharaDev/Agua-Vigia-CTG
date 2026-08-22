package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class AgregarEvidenciaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private ReporteCiudadanoRepository reportes;
    private AlmacenamientoPort almacenamiento;
    private AgregarEvidenciaService servicio;

    @BeforeEach
    void montar() {
        reportes = mock(ReporteCiudadanoRepository.class);
        almacenamiento = mock(AlmacenamientoPort.class);
        servicio = new AgregarEvidenciaService(reportes, almacenamiento);

        given(reportes.guardar(any(ReporteCiudadano.class))).willAnswer(invocacion -> invocacion.getArgument(0));
    }

    private ReporteCiudadano reporte() {
        return new ReporteCiudadano(new ReporteId("r1"), new SectorId("manga"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-1"), AHORA);
    }

    @Test
    void debeGuardarLaFotoConLaExtensionDerivadaDelContentType() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reporte()));
        given(almacenamiento.guardar(eq(".jpg"), any())).willReturn("/fotos/uuid.jpg");

        ReporteCiudadano actualizado = servicio.agregarEvidencia("r1", "image/jpeg", new byte[]{1, 2, 3});

        assertThat(actualizado.fotoUrl()).isEqualTo("/fotos/uuid.jpg");
        verify(almacenamiento).guardar(".jpg", new byte[]{1, 2, 3});
    }

    @Test
    void debeRechazarUnTipoDeArchivoNoPermitido() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reporte()));

        assertThatThrownBy(() -> servicio.agregarEvidencia("r1", "image/svg+xml", new byte[]{1}))
                .isInstanceOf(IllegalArgumentException.class);

        verify(almacenamiento, never()).guardar(any(), any());
        verify(reportes, never()).guardar(any());
    }

    @Test
    void debeRechazarUnContentTypeNulo() {
        given(reportes.buscarPorId(new ReporteId("r1"))).willReturn(Optional.of(reporte()));

        assertThatThrownBy(() -> servicio.agregarEvidencia("r1", null, new byte[]{1}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarSiElReporteNoExiste() {
        given(reportes.buscarPorId(new ReporteId("no-existe"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.agregarEvidencia("no-existe", "image/jpeg", new byte[]{1}))
                .isInstanceOf(IllegalArgumentException.class);

        verify(almacenamiento, never()).guardar(any(), any());
    }
}
