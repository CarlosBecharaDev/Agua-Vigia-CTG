package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integracion del adaptador contra un MongoDB real (DoD de D3, punto 1).
 * Se llama *Test y no *IT a proposito: el pom no configura failsafe, asi que un *IT no lo
 * ejecutaria nadie ni en local ni en el CI. Requiere Docker, que ya exige la compuerta C0.
 */
@Testcontainers
@DataMongoTest
@Import({SectorMongoAdapter.class, SectorMongoAdapterTest.RelojFijo.class})
class SectorMongoAdapterTest {

    private static final Instant INSTANTE_FIJO = Instant.parse("2026-08-08T15:30:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    static class RelojFijo {
        @Bean
        RelojPort reloj() {
            return () -> INSTANTE_FIJO;
        }
    }

    @Autowired
    private SectorMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("sectores").drop();
    }

    /** Documento tal como lo deja scripts/sembrar-sectores.mjs: sin estadoActual. */
    private void sembrar(String slug, String nombre, Integer poblacion) {
        org.bson.Document documento = new org.bson.Document()
                .append("slug", slug)
                .append("nombre", nombre)
                .append("poblacion", poblacion)
                .append("geometry", new org.bson.Document("type", "Polygon")
                        .append("coordinates", List.of(List.of(
                                List.of(-75.55, 10.40), List.of(-75.54, 10.40),
                                List.of(-75.54, 10.41), List.of(-75.55, 10.40)))));
        mongoTemplate.getDb().getCollection("sectores").insertOne(documento);
    }

    @Test
    void debeListarLosSectoresOrdenadosPorNombre() {
        sembrar("manga", "MANGA", 5000);
        sembrar("bocagrande", "BOCAGRANDE", 12000);

        List<Sector> sectores = adaptador.listarTodos();

        assertThat(sectores).extracting(s -> s.nombre()).containsExactly("BOCAGRANDE", "MANGA");
    }

    @Test
    void debeDevolverEstadoNuloCuandoElSectorNoTieneEstadoRegistrado() {
        sembrar("bocagrande", "BOCAGRANDE", 12000);

        Sector sector = adaptador.buscarPorId(new SectorId("bocagrande")).orElseThrow();

        // ADR-014: sin dato verificado no se afirma CON_SERVICIO.
        assertThat(sector.estadoActual()).isNull();
    }

    @Test
    void debeConservarLaPoblacionNulaDeLosBarriosSinDatoCensal() {
        sembrar("isla-fuerte", "ISLA FUERTE", null);

        Sector sector = adaptador.buscarPorId(new SectorId("isla-fuerte")).orElseThrow();

        assertThat(sector.poblacion()).isNull();
    }

    @Test
    void debeTratarUnEstadoDesconocidoComoAusenciaDeDato() {
        sembrar("manga", "MANGA", 5000);
        mongoTemplate.getDb().getCollection("sectores")
                .updateOne(new org.bson.Document("slug", "manga"),
                        new org.bson.Document("$set", new org.bson.Document("estadoActual", "INUNDADO")));

        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        assertThat(sector.estadoActual()).isNull();
    }

    @Test
    void debeSellarLaFechaAlRegistrarUnCambioDeEstado() {
        sembrar("manga", "MANGA", 5000);
        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        adaptador.guardar(sector.conEstado(EstadoServicio.SIN_SERVICIO));

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("sectores")
                .find(new org.bson.Document("slug", "manga")).first();
        assertThat(guardado.getString("estadoActual")).isEqualTo("SIN_SERVICIO");
        assertThat(guardado.getDate("estadoActualizadoEn").toInstant()).isEqualTo(INSTANTE_FIJO);
    }

    /** RF003 — sin esto la fecha se escribe en Mongo y se pierde al mapear a dominio, y el mapa
     * nunca puede decir "actualizado hace X". */
    @Test
    void debeDevolverLaFechaDelEstadoAlLeerElSector() {
        sembrar("manga", "MANGA", 5000);
        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();
        adaptador.guardar(sector.conEstado(EstadoServicio.SIN_SERVICIO));

        Sector releido = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        assertThat(releido.estadoActual()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(releido.estadoActualizadoEn()).isEqualTo(INSTANTE_FIJO);
    }

    @Test
    void unSectorSinEstadoNoDebeTraerFechaDeEstado() {
        sembrar("manga", "MANGA", 5000);

        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        assertThat(sector.estadoActual()).isNull();
        assertThat(sector.estadoActualizadoEn()).isNull();
    }

    /** El evento que dispara el correo tiene que llevar ya la fecha nueva: NotificarSuscripcionesService
     * lo recibe sin volver a consultar Mongo. */
    @Test
    void elSectorDevueltoPorGuardarDebeTraerLaFechaRecienSellada() {
        sembrar("manga", "MANGA", 5000);
        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        Sector guardado = adaptador.guardar(sector.conEstado(EstadoServicio.SIN_SERVICIO));

        assertThat(guardado.estadoActualizadoEn()).isEqualTo(INSTANTE_FIJO);
    }

    @Test
    void guardarNoDebePerderLaGeometriaSembradaPorD5() {
        sembrar("manga", "MANGA", 5000);
        Sector sector = adaptador.buscarPorId(new SectorId("manga")).orElseThrow();

        adaptador.guardar(sector.conEstado(EstadoServicio.PRESION_BAJA));

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("sectores")
                .find(new org.bson.Document("slug", "manga")).first();
        assertThat(guardado.get("geometry")).isNotNull();
    }

    @Test
    void buscarPorIdDebeDevolverVacioCuandoElSectorNoExiste() {
        assertThat(adaptador.buscarPorId(new SectorId("no-existe"))).isEmpty();
    }
}
