package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.AgregadoDuraciones;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.PuntoAgregadoMensual;
import com.aguavigia.ctg.domain.SectorId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Prueba de integracion del adaptador contra un MongoDB real (DoD de D3, punto 1), igual que
 * SectorMongoAdapterTest.
 */
@Testcontainers
@DataMongoTest
@Import(CorteAguaMongoAdapter.class)
class CorteAguaMongoAdapterTest {

    private static final Instant INICIO = Instant.parse("2026-08-09T10:00:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private CorteAguaMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("cortes").drop();
    }

    private CorteAgua corteDePrueba(String id, EstadoCorte estado, List<String> sectores) {
        return CorteAgua.builder()
                .id(new CorteId(id))
                .sectoresAfectados(sectores.stream().map(SectorId::new).toList())
                .inicio(INICIO)
                .finPrometido(INICIO.plus(6, ChronoUnit.HOURS))
                .causa("Mantenimiento planta El Bosque")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(estado)
                .build();
    }

    private CorteAgua corteCerrado(String id, List<String> sectores, Instant inicio, Duration prometida, Duration real) {
        return CorteAgua.builder()
                .id(new CorteId(id))
                .sectoresAfectados(sectores.stream().map(SectorId::new).toList())
                .inicio(inicio)
                .finPrometido(inicio.plus(prometida))
                .finReal(inicio.plus(real))
                .causa("Mantenimiento planta El Bosque")
                .origen(OrigenCorte.OFICIAL_ACUACAR)
                .estado(EstadoCorte.RESTABLECIDO)
                .build();
    }

    @Test
    void debeGuardarYRecuperarUnCortePorId() {
        adaptador.guardar(corteDePrueba("corte-1", EstadoCorte.ANUNCIADO, List.of("manga")));

        CorteAgua recuperado = adaptador.buscarPorId(new CorteId("corte-1")).orElseThrow();

        assertThat(recuperado.causa()).isEqualTo("Mantenimiento planta El Bosque");
        assertThat(recuperado.origen()).isEqualTo(OrigenCorte.OFICIAL_ACUACAR);
        assertThat(recuperado.estado()).isEqualTo(EstadoCorte.ANUNCIADO);
        assertThat(recuperado.ventana().estaCerrada()).isFalse();
    }

    @Test
    void debeDevolverVacioSiElCorteNoExiste() {
        assertThat(adaptador.buscarPorId(new CorteId("no-existe"))).isEmpty();
    }

    @Test
    void debeListarLosCortesQueAfectanUnSector() {
        adaptador.guardar(corteDePrueba("corte-1", EstadoCorte.ANUNCIADO, List.of("manga", "bocagrande")));
        adaptador.guardar(corteDePrueba("corte-2", EstadoCorte.ANUNCIADO, List.of("pie-de-la-popa")));

        List<CorteAgua> deManga = adaptador.listarPorSector(new SectorId("manga"));

        assertThat(deManga).extracting(c -> c.id().valor()).containsExactly("corte-1");
    }

    @Test
    void debeListarTodosLosCortesSinFiltrarPorSector() {
        adaptador.guardar(corteDePrueba("corte-1", EstadoCorte.ANUNCIADO, List.of("manga")));
        adaptador.guardar(corteDePrueba("corte-2", EstadoCorte.ANUNCIADO, List.of("pie-de-la-popa")));

        List<CorteAgua> todos = adaptador.listarTodos();

        assertThat(todos).extracting(c -> c.id().valor()).containsExactlyInAnyOrder("corte-1", "corte-2");
    }

    @Test
    void debeConservarLaHoraRealAlCerrarUnCorte() {
        CorteAgua abierto = corteDePrueba("corte-1", EstadoCorte.CONFIRMADO, List.of("manga"));
        adaptador.guardar(abierto);

        Instant finReal = INICIO.plus(5, ChronoUnit.HOURS);
        CorteAgua cerrado = CorteAgua.builder()
                .id(abierto.id())
                .sectoresAfectados(abierto.sectoresAfectados())
                .inicio(abierto.ventana().inicio())
                .finPrometido(abierto.ventana().finPrometido())
                .finReal(finReal)
                .causa(abierto.causa())
                .origen(abierto.origen())
                .estado(EstadoCorte.RESTABLECIDO)
                .build();
        adaptador.guardar(cerrado);

        CorteAgua recuperado = adaptador.buscarPorId(new CorteId("corte-1")).orElseThrow();

        assertThat(recuperado.estado()).isEqualTo(EstadoCorte.RESTABLECIDO);
        assertThat(recuperado.ventana().estaCerrada()).isTrue();
        assertThat(recuperado.ventana().finReal()).isEqualTo(finReal);
    }

    @Test
    void debeFallarAlLeerUnDocumentoConEstadoIncoherenteConLaVentana() {
        CorteAguaDocumento documento = new CorteAguaDocumento();
        documento.setId("corte-corrupto");
        documento.setSectoresAfectados(List.of("manga"));
        documento.setInicio(INICIO);
        documento.setFinPrometido(INICIO.plus(6, ChronoUnit.HOURS));
        documento.setFinReal(null);
        documento.setCausa("Mantenimiento planta El Bosque");
        documento.setOrigen(OrigenCorte.OFICIAL_ACUACAR.name());
        documento.setEstado(EstadoCorte.RESTABLECIDO.name());
        mongoTemplate.save(documento);

        assertThatThrownBy(() -> adaptador.buscarPorId(new CorteId("corte-corrupto")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("corte-corrupto");
    }

    /** estado-del-backend.md #6.1 — la suma para el índice global la hace el pipeline, no Java. */
    @Test
    void debeAgregarLasDuracionesDeCortesCerradosDeTodosLosSectores() {
        adaptador.guardar(corteCerrado("corte-1", List.of("manga"), INICIO, Duration.ofHours(2), Duration.ofHours(2)));
        adaptador.guardar(corteCerrado("corte-2", List.of("bocagrande"), INICIO, Duration.ofHours(2), Duration.ofHours(6)));

        AgregadoDuraciones agregado = adaptador.agregarCerrados(null);

        assertThat(agregado.duracionPrometida()).isEqualTo(Duration.ofHours(4));
        assertThat(agregado.duracionReal()).isEqualTo(Duration.ofHours(8));
        assertThat(agregado.cantidadCortes()).isEqualTo(2);
    }

    @Test
    void debeExcluirCortesAbiertosDeAgregarCerrados() {
        adaptador.guardar(corteCerrado("cerrado", List.of("manga"), INICIO, Duration.ofHours(2), Duration.ofHours(4)));
        adaptador.guardar(corteDePrueba("abierto", EstadoCorte.CONFIRMADO, List.of("manga")));

        AgregadoDuraciones agregado = adaptador.agregarCerrados(null);

        assertThat(agregado.cantidadCortes()).isEqualTo(1);
        assertThat(agregado.duracionReal()).isEqualTo(Duration.ofHours(4));
    }

    @Test
    void debeDevolverAgregadoVacioSinCortesCerrados() {
        assertThat(adaptador.agregarCerrados(null)).isEqualTo(AgregadoDuraciones.vacio());
    }

    @Test
    void debeAgregarSoloLosCortesDeUnSectorAlPasarSectorId() {
        adaptador.guardar(corteCerrado("corte-1", List.of("manga"), INICIO, Duration.ofHours(2), Duration.ofHours(4)));
        adaptador.guardar(corteCerrado("corte-2", List.of("bocagrande"), INICIO, Duration.ofHours(1), Duration.ofHours(1)));

        AgregadoDuraciones agregado = adaptador.agregarCerrados(new SectorId("manga"));

        assertThat(agregado.cantidadCortes()).isEqualTo(1);
        assertThat(agregado.duracionReal()).isEqualTo(Duration.ofHours(4));
    }

    /**
     * RF024 — un corte restablecido a las 02:00Z del 1 de agosto fue el 31 de julio a las 21:00
     * para quien lo vivió en Cartagena (UTC-5): debe caer en julio, no en agosto.
     */
    @Test
    void debeAgruparPorMesEnHoraDeCartagenaYNoEnUtc() {
        adaptador.guardar(corteCerrado("corte-1", List.of("manga"),
                Instant.parse("2026-07-31T20:00:00Z"), Duration.ofHours(2), Duration.ofHours(6)));

        List<PuntoAgregadoMensual> serie = adaptador.agregarCerradosPorMes(null, null, null);

        assertThat(serie).extracting(PuntoAgregadoMensual::periodo).containsExactly(YearMonth.of(2026, 7));
    }

    @Test
    void debeOrdenarLaSerieMensualCronologicamente() {
        adaptador.guardar(corteCerrado("c-sep", List.of("manga"),
                Instant.parse("2026-09-10T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)));
        adaptador.guardar(corteCerrado("c-jul", List.of("manga"),
                Instant.parse("2026-07-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(2)));
        adaptador.guardar(corteCerrado("c-ago", List.of("manga"),
                Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(6)));

        List<PuntoAgregadoMensual> serie = adaptador.agregarCerradosPorMes(null, null, null);

        assertThat(serie).extracting(PuntoAgregadoMensual::periodo)
                .containsExactly(YearMonth.of(2026, 7), YearMonth.of(2026, 8), YearMonth.of(2026, 9));
    }

    @Test
    void debeAcotarLaSerieMensualPorLaHoraRealDeRestablecimiento() {
        adaptador.guardar(corteCerrado("julio", List.of("manga"),
                Instant.parse("2026-07-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)));
        adaptador.guardar(corteCerrado("agosto", List.of("manga"),
                Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)));

        List<PuntoAgregadoMensual> serie = adaptador.agregarCerradosPorMes(null,
                Instant.parse("2026-08-01T00:00:00Z"), Instant.parse("2026-08-31T23:59:59Z"));

        assertThat(serie).extracting(PuntoAgregadoMensual::periodo).containsExactly(YearMonth.of(2026, 8));
    }

    @Test
    void debeDevolverListaVaciaCuandoNoHayCortesCerradosEnElRango() {
        adaptador.guardar(corteCerrado("corte-1", List.of("manga"),
                Instant.parse("2026-08-05T13:00:00Z"), Duration.ofHours(2), Duration.ofHours(4)));

        List<PuntoAgregadoMensual> serie = adaptador.agregarCerradosPorMes(
                null, Instant.parse("2027-01-01T00:00:00Z"), null);

        assertThat(serie).isEmpty();
    }
}
