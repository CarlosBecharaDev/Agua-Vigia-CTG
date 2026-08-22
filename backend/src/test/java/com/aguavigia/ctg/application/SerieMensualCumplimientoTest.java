package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AgregadoDuraciones;
import com.aguavigia.ctg.domain.PuntoAgregadoMensual;
import com.aguavigia.ctg.domain.PuntoSerieCumplimiento;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * RF024 — el agrupamiento por mes, la zona horaria de Cartagena y el filtro de rango viven ahora
 * en el pipeline Mongo (`CorteAguaRepository.agregarCerradosPorMes`, ver `CorteAguaMongoAdapter` y
 * su prueba de integración `CorteAguaMongoAdapterTest`). Lo único que le corresponde a
 * `CalcularCumplimientoService` es traducir cada `PuntoAgregadoMensual` a `PuntoSerieCumplimiento`
 * calculando el porcentaje (`ADR-022`), y pasar sectorId/desde/hasta intactos al puerto.
 */
class SerieMensualCumplimientoTest {

    private CorteAguaRepository cortes;
    private CalcularCumplimientoService servicio;

    @BeforeEach
    void montar() {
        cortes = mock(CorteAguaRepository.class);
        servicio = new CalcularCumplimientoService(cortes);
    }

    @Test
    void debeTraducirCadaPuntoAgregadoASuIndiceDeCumplimiento() {
        given(cortes.agregarCerradosPorMes(null, null, null)).willReturn(List.of(
                new PuntoAgregadoMensual(YearMonth.of(2026, 7),
                        new AgregadoDuraciones(Duration.ofHours(2), Duration.ofHours(2), 1)),
                new PuntoAgregadoMensual(YearMonth.of(2026, 8),
                        new AgregadoDuraciones(Duration.ofHours(4), Duration.ofHours(8), 2))));

        List<PuntoSerieCumplimiento> serie = servicio.serieMensual(null, null, null);

        assertThat(serie).extracting(PuntoSerieCumplimiento::periodo)
                .containsExactly(YearMonth.of(2026, 7), YearMonth.of(2026, 8));

        PuntoSerieCumplimiento agosto = serie.get(1);
        // ADR-022: suma de duraciones, no promedio de porcentajes. 4h prometidas contra 8h reales.
        assertThat(agosto.indice().duracionPrometida()).isEqualTo(Duration.ofHours(4));
        assertThat(agosto.indice().duracionReal()).isEqualTo(Duration.ofHours(8));
        assertThat(agosto.indice().desviacion()).isEqualTo(Duration.ofHours(4));
        assertThat(agosto.indice().porcentajeCumplimiento()).isEqualTo(50.0);
        assertThat(agosto.cantidadCortes()).isEqualTo(2);
    }

    @Test
    void debeAsignarElSectorIdDeLaConsultaACadaPuntoDeLaSerie() {
        given(cortes.agregarCerradosPorMes(new SectorId("manga"), null, null)).willReturn(List.of(
                new PuntoAgregadoMensual(YearMonth.of(2026, 8),
                        new AgregadoDuraciones(Duration.ofHours(2), Duration.ofHours(4), 1))));

        List<PuntoSerieCumplimiento> serie = servicio.serieMensual(new SectorId("manga"), null, null);

        assertThat(serie).hasSize(1);
        assertThat(serie.getFirst().indice().sectorId()).isEqualTo(new SectorId("manga"));
    }

    /** Una serie sin datos es una respuesta válida, no un 400 — a diferencia de global()/porSector(). */
    @Test
    void debeDevolverListaVaciaCuandoElPuertoNoDevuelveNingunMes() {
        given(cortes.agregarCerradosPorMes(null, null, null)).willReturn(List.of());

        assertThat(servicio.serieMensual(null, null, null)).isEmpty();
    }

    @Test
    void debePasarElRangoDeFechasIntactoAlPuerto() {
        Instant desde = Instant.parse("2026-08-01T00:00:00Z");
        Instant hasta = Instant.parse("2026-08-31T23:59:59Z");
        given(cortes.agregarCerradosPorMes(null, desde, hasta)).willReturn(List.of());

        servicio.serieMensual(null, desde, hasta);

        verify(cortes).agregarCerradosPorMes(null, desde, hasta);
    }
}
