package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.OrigenCorte;
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

/** RF024 — evolución del Índice de Cumplimiento en el tiempo. */
class SerieMensualCumplimientoTest {

    private CorteAguaRepository cortes;
    private CalcularCumplimientoService servicio;

    @BeforeEach
    void montar() {
        cortes = mock(CorteAguaRepository.class);
        servicio = new CalcularCumplimientoService(cortes);
    }

    private CorteAgua corte(String id, Instant inicio, Duration prometida, Duration real) {
        return CorteAgua.builder()
                .id(new CorteId(id))
                .sectoresAfectados(List.of(new SectorId("manga")))
                .inicio(inicio)
                .finPrometido(inicio.plus(prometida))
                .finReal(real == null ? null : inicio.plus(real))
                .causa("Mantenimiento")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(real == null ? com.aguavigia.ctg.domain.EstadoCorte.CONFIRMADO
                        : com.aguavigia.ctg.domain.EstadoCorte.RESTABLECIDO)
                .build();
    }

    @Test
    void debeDevolverUnPuntoPorMesOrdenadoCronologicamente() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("c-sep", Instant.parse("2026-09-10T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)),
                corte("c-jul", Instant.parse("2026-07-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(2)),
                corte("c-ago", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(6))));

        List<PuntoSerieCumplimiento> serie = servicio.serieMensual(null, null, null);

        assertThat(serie).extracting(PuntoSerieCumplimiento::periodo)
                .containsExactly(YearMonth.of(2026, 7), YearMonth.of(2026, 8), YearMonth.of(2026, 9));
    }

    @Test
    void debeAgregarPorSumaDeDuracionesDentroDelMes() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("c1", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)),
                corte("c2", Instant.parse("2026-08-20T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4))));

        PuntoSerieCumplimiento agosto = servicio.serieMensual(null, null, null).getFirst();

        // ADR-022: suma de duraciones, no promedio de porcentajes. 4h prometidas contra 8h reales.
        assertThat(agosto.indice().duracionPrometida()).isEqualTo(Duration.ofHours(4));
        assertThat(agosto.indice().duracionReal()).isEqualTo(Duration.ofHours(8));
        assertThat(agosto.indice().desviacion()).isEqualTo(Duration.ofHours(4));
        assertThat(agosto.indice().porcentajeCumplimiento()).isEqualTo(50.0);
        assertThat(agosto.cantidadCortes()).isEqualTo(2);
    }

    @Test
    void debeIgnorarLosCortesQueSiguenAbiertos() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("cerrado", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)),
                corte("abierto", Instant.parse("2026-08-06T13:00:00Z"), Duration.ofHours(2), null)));

        assertThat(servicio.serieMensual(null, null, null).getFirst().cantidadCortes()).isEqualTo(1);
    }

    /** Una serie sin datos es una respuesta válida, no un 400. */
    @Test
    void debeDevolverListaVaciaCuandoNoHayCortesCerrados() {
        given(cortes.listarTodos()).willReturn(List.of());

        assertThat(servicio.serieMensual(null, null, null)).isEmpty();
    }

    @Test
    void conSectorDebeConsultarSoloLosCortesDeEseSector() {
        given(cortes.listarPorSector(new SectorId("manga"))).willReturn(List.of(
                corte("c1", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4))));

        List<PuntoSerieCumplimiento> serie = servicio.serieMensual(new SectorId("manga"), null, null);

        assertThat(serie).hasSize(1);
        assertThat(serie.getFirst().indice().sectorId()).isEqualTo(new SectorId("manga"));
    }

    @Test
    void debeAcotarPorLaHoraRealDeRestablecimiento() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("julio", Instant.parse("2026-07-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)),
                corte("agosto", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)),
                corte("septiembre", Instant.parse("2026-09-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4))));

        List<PuntoSerieCumplimiento> serie = servicio.serieMensual(null,
                Instant.parse("2026-08-01T00:00:00Z"), Instant.parse("2026-08-31T23:59:59Z"));

        assertThat(serie).extracting(PuntoSerieCumplimiento::periodo)
                .containsExactly(YearMonth.of(2026, 8));
    }

    /**
     * El mes se decide en hora de Cartagena: un corte restablecido a las 02:00Z del 1 de agosto fue
     * el 31 de julio a las 21:00 para quien lo vivió, y esta serie la lee un vecino de la ciudad.
     */
    @Test
    void debeAgruparElMesEnHoraDeCartagenaYNoEnUtc() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("c1", Instant.parse("2026-07-31T22:00:00Z"), Duration.ofHours(2), Duration.ofHours(4))));

        assertThat(servicio.serieMensual(null, null, null).getFirst().periodo())
                .isEqualTo(YearMonth.of(2026, 7));
    }

    @Test
    void unRangoQueNoCubreNingunCorteDebeDarSerieVacia() {
        given(cortes.listarTodos()).willReturn(List.of(
                corte("c1", Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4))));

        assertThat(servicio.serieMensual(null, Instant.parse("2027-01-01T00:00:00Z"), null)).isEmpty();
    }
}
