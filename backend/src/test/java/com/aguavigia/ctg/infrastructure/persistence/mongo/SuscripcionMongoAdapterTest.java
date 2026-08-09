package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Prueba de integracion contra un MongoDB real (mismo patron que SectorMongoAdapterTest). */
@Testcontainers
@DataMongoTest
@Import(SuscripcionMongoAdapter.class)
class SuscripcionMongoAdapterTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private SuscripcionMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("suscripciones").drop();
    }

    @Test
    void debeGuardarUnaSuscripcionConTodosSusCampos() {
        Suscripcion suscripcion = new Suscripcion(
                new SuscripcionId("s1"),
                new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande"), new SectorId("manga")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-1",
                AHORA);

        adaptador.guardar(suscripcion);

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("suscripciones")
                .find(new org.bson.Document("_id", "s1")).first();
        assertThat(guardado.getString("correo")).isEqualTo("vecino@correo.com");
        assertThat(guardado.getList("sectorIds", String.class)).containsExactly("bocagrande", "manga");
        assertThat(guardado.getString("estado")).isEqualTo("PENDIENTE_CONFIRMACION");
        assertThat(guardado.getString("tokenConfirmacion")).isEqualTo("token-1");
        assertThat(guardado.getDate("creadaEn").toInstant()).isEqualTo(AHORA);
    }

    @Test
    void guardarDebeDevolverLaMismaSuscripcionRecibida() {
        Suscripcion suscripcion = new Suscripcion(
                new SuscripcionId("s2"),
                new CorreoElectronico("otro@correo.com"),
                List.of(new SectorId("manga")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-2",
                AHORA);

        Suscripcion resultado = adaptador.guardar(suscripcion);

        assertThat(resultado).isEqualTo(suscripcion);
    }
}
