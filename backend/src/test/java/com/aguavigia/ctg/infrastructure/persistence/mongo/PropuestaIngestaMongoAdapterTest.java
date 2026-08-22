package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
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

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DataMongoTest
@Import(PropuestaIngestaMongoAdapter.class)
class PropuestaIngestaMongoAdapterTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private PropuestaIngestaMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("propuestas_ingesta").drop();
    }

    private PropuestaIngesta propuesta(String id, String sector, EstadoServicio estado, Instant detectadaEn) {
        return new PropuestaIngesta(new PropuestaId(id), new SectorId(sector), estado, "acuacar",
                "https://acuacar.com/" + id, "cita de " + id, 0.6, detectadaEn);
    }

    @Test
    void debeGuardarYReconstruirLaPropuestaCompleta() {
        adaptador.guardar(propuesta("p-1", "manga", EstadoServicio.SIN_SERVICIO, AHORA));

        PropuestaIngesta recuperada = adaptador.buscarPorId(new PropuestaId("p-1")).orElseThrow();

        assertThat(recuperada.sectorId()).isEqualTo(new SectorId("manga"));
        assertThat(recuperada.estadoPropuesto()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(recuperada.fuente()).isEqualTo("acuacar");
        assertThat(recuperada.urlOriginal()).isEqualTo("https://acuacar.com/p-1");
        assertThat(recuperada.citaTextual()).isEqualTo("cita de p-1");
        assertThat(recuperada.confianza()).isEqualTo(0.6);
        assertThat(recuperada.detectadaEn()).isEqualTo(AHORA);
        assertThat(recuperada.estadoRevision()).isEqualTo(EstadoRevision.PENDIENTE);
    }

    @Test
    void listarPendientesDebeExcluirLasYaRevisadasYOrdenarPorMasReciente() {
        adaptador.guardar(propuesta("vieja", "manga", EstadoServicio.SIN_SERVICIO, AHORA.minusSeconds(3600)));
        adaptador.guardar(propuesta("nueva", "bocagrande", EstadoServicio.PRESION_BAJA, AHORA));
        adaptador.guardar(propuesta("aprobada", "crespo", EstadoServicio.SIN_SERVICIO, AHORA).aprobar());
        adaptador.guardar(propuesta("descartada", "torices", EstadoServicio.SIN_SERVICIO, AHORA).descartar());

        assertThat(adaptador.listarPendientes(0, 50).contenido())
                .extracting(propuesta -> propuesta.id().valor())
                .containsExactly("nueva", "vieja");
    }

    /** La cola crece mientras no haya un veedor revisando; el total tiene que reflejarla entera
     * aunque la página traiga solo un tramo. */
    @Test
    void debePaginarLaColaYReportarElTotalCompleto() {
        for (int i = 0; i < 7; i++) {
            adaptador.guardar(propuesta("p-" + i, "manga", EstadoServicio.SIN_SERVICIO,
                    AHORA.minusSeconds(i * 60L)));
        }

        var primera = adaptador.listarPendientes(0, 3);
        var tercera = adaptador.listarPendientes(2, 3);

        assertThat(primera.contenido()).hasSize(3);
        assertThat(primera.totalElementos()).isEqualTo(7);
        assertThat(primera.totalPaginas()).isEqualTo(3);
        assertThat(primera.hayMas()).isTrue();
        assertThat(tercera.contenido()).hasSize(1);
        assertThat(tercera.hayMas()).isFalse();
        // Más recientes primero, y sin repetir entre páginas.
        assertThat(primera.contenido()).extracting(p -> p.id().valor()).containsExactly("p-0", "p-1", "p-2");
        assertThat(tercera.contenido()).extracting(p -> p.id().valor()).containsExactly("p-6");
    }

    @Test
    void existePendienteDebeDistinguirSectorEstadoYRevision() {
        adaptador.guardar(propuesta("p-1", "manga", EstadoServicio.SIN_SERVICIO, AHORA));

        assertThat(adaptador.existePendiente(new SectorId("manga"), EstadoServicio.SIN_SERVICIO)).isTrue();
        assertThat(adaptador.existePendiente(new SectorId("manga"), EstadoServicio.PRESION_BAJA)).isFalse();
        assertThat(adaptador.existePendiente(new SectorId("bocagrande"), EstadoServicio.SIN_SERVICIO)).isFalse();
    }

    /** Ya revisada deja de bloquear: si el corte vuelve a pasar, el veedor debe poder verlo otra vez. */
    @Test
    void unaPropuestaYaRevisadaNoDebeContarComoPendiente() {
        adaptador.guardar(propuesta("p-1", "manga", EstadoServicio.SIN_SERVICIO, AHORA).aprobar());

        assertThat(adaptador.existePendiente(new SectorId("manga"), EstadoServicio.SIN_SERVICIO)).isFalse();
    }

    @Test
    void guardarDebeSobrescribirLaMismaPropuestaAlRevisarla() {
        adaptador.guardar(propuesta("p-1", "manga", EstadoServicio.SIN_SERVICIO, AHORA));
        adaptador.guardar(adaptador.buscarPorId(new PropuestaId("p-1")).orElseThrow().aprobar());

        assertThat(mongoTemplate.getDb().getCollection("propuestas_ingesta").countDocuments()).isEqualTo(1);
        assertThat(adaptador.buscarPorId(new PropuestaId("p-1")).orElseThrow().estadoRevision())
                .isEqualTo(EstadoRevision.APROBADA);
    }

    @Test
    void buscarPorIdDebeDevolverVacioCuandoNoExiste() {
        assertThat(adaptador.buscarPorId(new PropuestaId("no-existe"))).isEmpty();
    }
}
