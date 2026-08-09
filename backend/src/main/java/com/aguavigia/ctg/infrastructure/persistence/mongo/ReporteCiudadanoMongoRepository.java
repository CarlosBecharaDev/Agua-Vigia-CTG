package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ReporteCiudadanoMongoRepository extends MongoRepository<ReporteCiudadanoDocumento, String> {

    List<ReporteCiudadanoDocumento> findBySectorIdAndTimestampGreaterThanEqual(String sectorId, Instant desde);

    /**
     * Solo para PENDIENTE: incluye `estadoModeracion` nulo además del literal, porque un documento
     * sembrado antes de RF018 no tiene el campo y sigue siendo candidato a moderación (`ADR-023`).
     * No usar con APROBADO/DESCARTADO — ahí un nulo no debería contar como coincidencia.
     */
    @Query("{ '$or': [ { 'estadoModeracion': ?0 }, { 'estadoModeracion': null } ] }")
    List<ReporteCiudadanoDocumento> findPendientesIncluyendoNulo(String pendiente);
}
