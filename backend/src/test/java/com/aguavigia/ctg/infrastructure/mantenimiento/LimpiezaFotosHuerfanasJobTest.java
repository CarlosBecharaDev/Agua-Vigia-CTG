package com.aguavigia.ctg.infrastructure.mantenimiento;

import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class LimpiezaFotosHuerfanasJobTest {

    private AlmacenamientoPort almacenamiento;
    private ReporteCiudadanoRepository reportes;
    private LimpiezaFotosHuerfanasJob job;

    @BeforeEach
    void montar() {
        almacenamiento = mock(AlmacenamientoPort.class);
        reportes = mock(ReporteCiudadanoRepository.class);
    }

    private void conPropiedades(MantenimientoProperties.FotosHuerfanas fotosHuerfanas) {
        job = new LimpiezaFotosHuerfanasJob(almacenamiento, reportes,
                new MantenimientoProperties(fotosHuerfanas, null));
    }

    @Test
    void debeBorrarSoloLosArchivosSinReferenciaEnMongo() {
        conPropiedades(new MantenimientoProperties.FotosHuerfanas(true, 24));
        given(reportes.listarNombresDeFotoReferenciados()).willReturn(Set.of("referenciada.jpg"));
        given(almacenamiento.listarNombresConAntiguedadMinima(Duration.ofHours(24)))
                .willReturn(Set.of("referenciada.jpg", "huerfana.jpg"));

        job.limpiar();

        verify(almacenamiento).eliminar("huerfana.jpg");
        verify(almacenamiento, never()).eliminar("referenciada.jpg");
    }

    @Test
    void noDebeHacerNadaSiElJobEstaDeshabilitado() {
        conPropiedades(new MantenimientoProperties.FotosHuerfanas(false, 24));

        job.limpiar();

        verify(almacenamiento, never()).listarNombresConAntiguedadMinima(any());
        verify(almacenamiento, never()).eliminar(any());
    }
}
