package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.OrigenCorte;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

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
}
