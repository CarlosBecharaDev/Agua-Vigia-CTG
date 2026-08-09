package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
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

@Testcontainers
@DataMongoTest
@Import(EventoBitacoraMongoAdapter.class)
class EventoBitacoraMongoAdapterTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private EventoBitacoraMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("eventos_bitacora").drop();
    }

    @Test
    void debeGuardarUnEventoDeConsensoCiudadano() {
        EventoBitacora evento = new EventoBitacora(
                new EventoId("e1"), TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS,
                new SectorId("bocagrande"), null, AHORA, "3 reportes confirmaron SIN_SERVICIO");

        adaptador.guardar(evento);

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("eventos_bitacora")
                .find(new org.bson.Document("_id", "e1")).first();
        assertThat(guardado.getString("tipo")).isEqualTo("CORTE_CONFIRMADO_POR_CIUDADANOS");
        assertThat(guardado.getString("sectorId")).isEqualTo("bocagrande");
        assertThat(guardado.get("corteId")).isNull();
    }

    @Test
    void debeListarLosEventosDelMasRecienteAlMasViejo() {
        adaptador.guardar(new EventoBitacora(new EventoId("e1"), TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS,
                new SectorId("bocagrande"), null, AHORA, "primero"));
        adaptador.guardar(new EventoBitacora(new EventoId("e2"), TipoEvento.CORTE_RESTABLECIDO,
                new SectorId("bocagrande"), null, AHORA.plusSeconds(60), "segundo"));

        List<EventoBitacora> eventos = adaptador.listarTodos();

        assertThat(eventos).extracting(e -> e.id().valor()).containsExactly("e2", "e1");
    }
}
