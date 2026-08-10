package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeospatialIndex;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import org.bson.Document;

/**
 * Asegura los indices de `sectores` al arrancar. Spring Data no los crea solo (la creacion
 * automatica esta desactivada por defecto desde 3.0) y el sembrador de D5 solo corre a mano,
 * asi que sin esto un despliegue limpio quedaria sin el 2dsphere que necesitan las consultas
 * geoespaciales de M2.
 *
 * createIndex es idempotente: repetirlo con la misma definicion no hace nada.
 */
@Component
public class IndicesMongo {

    private static final Logger log = LoggerFactory.getLogger(IndicesMongo.class);

    private final MongoTemplate mongoTemplate;

    public IndicesMongo(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void asegurarIndices() {
        try {
            var indicesSectores = mongoTemplate.indexOps(SectorDocumento.class);
            indicesSectores.ensureIndex(new GeospatialIndex("geometry").typed(GeoSpatialIndexType.GEO_2DSPHERE));
            indicesSectores.ensureIndex(new Index().on("slug", Sort.Direction.ASC).unique());
            log.info("Indices de `sectores` asegurados: geometry (2dsphere) y slug (unico)");

            var indicesCortes = mongoTemplate.indexOps(CorteAguaDocumento.class);
            indicesCortes.ensureIndex(new Index().on("sectoresAfectados", Sort.Direction.ASC));
            log.info("Indices de `cortes` asegurados: sectoresAfectados");

            // RegistrarReporteService.registrar() y EvaluarConsensoService llaman ambos
            // listarRecientesPorSector en cada POST /api/reportes — sin este compuesto, cada
            // llamada es un collection scan completo sobre una coleccion que solo crece.
            var indicesReportes = mongoTemplate.indexOps(ReporteCiudadanoDocumento.class);
            indicesReportes.ensureIndex(new CompoundIndexDefinition(
                    new Document("sectorId", 1).append("timestamp", -1)));
            indicesReportes.ensureIndex(new Index().on("estadoModeracion", Sort.Direction.ASC));
            log.info("Indices de `reportes` asegurados: sectorId+timestamp (compuesto) y estadoModeracion");

            var indicesSuscripciones = mongoTemplate.indexOps(SuscripcionDocumento.class);
            indicesSuscripciones.ensureIndex(new Index().on("tokenConfirmacion", Sort.Direction.ASC).unique());
            indicesSuscripciones.ensureIndex(new Index().on("sectorIds", Sort.Direction.ASC));
            log.info("Indices de `suscripciones` asegurados: tokenConfirmacion (unico) y sectorIds");

            var indicesBitacora = mongoTemplate.indexOps(EventoBitacoraDocumento.class);
            indicesBitacora.ensureIndex(new Index().on("timestamp", Sort.Direction.DESC));
            log.info("Indices de `eventos_bitacora` asegurados: timestamp");
        } catch (DataAccessException noHayMongo) {
            // El backend no debe caerse porque Mongo no este disponible al arrancar (DoD de D3,
            // punto 2). Se registra y se sigue: las consultas fallaran con su propio error.
            log.warn("No se pudieron asegurar los indices: {}", noHayMongo.getMessage());
        }
    }
}
