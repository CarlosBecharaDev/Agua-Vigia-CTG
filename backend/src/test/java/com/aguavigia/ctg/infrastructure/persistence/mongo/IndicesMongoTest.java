package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Spring Data no crea índices solos (creación automática desactivada desde 3.0) — esta prueba
 * confirma que IndicesMongo.asegurarIndices() realmente los deja en Mongo, no solo que el método
 * no lance una excepción.
 */
@Testcontainers
@DataMongoTest
@Import(IndicesMongo.class)
class IndicesMongoTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private IndicesMongo indicesMongo;

    @Autowired
    private MongoTemplate mongoTemplate;

    private static Set<String> nombresDeIndices(List<IndexInfo> indices) {
        return indices.stream().map(IndexInfo::getName).collect(Collectors.toSet());
    }

    @Test
    void debeAsegurarLosIndicesDeReportesSuscripcionesYBitacora() {
        indicesMongo.asegurarIndices();

        Set<String> indicesReportes = nombresDeIndices(mongoTemplate.indexOps(ReporteCiudadanoDocumento.class).getIndexInfo());
        assertThat(indicesReportes).contains("sectorId_1_timestamp_-1", "estadoModeracion_1");

        Set<String> indicesSuscripciones = nombresDeIndices(mongoTemplate.indexOps(SuscripcionDocumento.class).getIndexInfo());
        assertThat(indicesSuscripciones).contains("tokenConfirmacion_1", "sectorIds_1");

        Set<String> indicesBitacora = nombresDeIndices(mongoTemplate.indexOps(EventoBitacoraDocumento.class).getIndexInfo());
        assertThat(indicesBitacora).contains("timestamp_-1");
    }
}
