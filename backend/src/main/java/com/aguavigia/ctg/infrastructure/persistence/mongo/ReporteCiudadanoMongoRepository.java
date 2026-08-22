package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.List;

public interface ReporteCiudadanoMongoRepository extends MongoRepository<ReporteCiudadanoDocumento, String> {

    /**
     * Sin filtrar por moderación — usado para el cupo por dispositivo (RF006), donde un reporte
     * descartado por el veedor debe seguir contando contra el abusador que lo mandó. El compuesto
     * sectorId+timestamp (IndicesMongo) cubre el filtro; huella queda para Mongo como un scan
     * acotado a esa ventana, sin materializar documentos en la JVM.
     */
    long countBySectorIdAndTimestampGreaterThanEqualAndHuella(String sectorId, Instant desde, String huella);

    /**
     * Excluye lo que el veedor ya descartó como spam (RF018). `$ne` en Mongo también hace match
     * sobre campo ausente/nulo, así que un reporte sembrado antes de RF018 (sin
     * `estadoModeracion`) sigue sustentando el consenso, igual que en
     * {@link #findPendientesIncluyendoNulo}. Usado solo para el sustento del consenso
     * (RF009-RF011) — para el cupo por dispositivo ver
     * {@link #countBySectorIdAndTimestampGreaterThanEqualAndHuella}.
     */
    List<ReporteCiudadanoDocumento> findBySectorIdAndTimestampGreaterThanEqualAndEstadoModeracionNot(
            String sectorId, Instant desde, String estadoModeracionExcluido);

    /**
     * Solo para PENDIENTE: incluye `estadoModeracion` nulo además del literal, porque un documento
     * sembrado antes de RF018 no tiene el campo y sigue siendo candidato a moderación (`ADR-023`).
     * No usar con APROBADO/DESCARTADO — ahí un nulo no debería contar como coincidencia.
     */
    @Query("{ '$or': [ { 'estadoModeracion': ?0 }, { 'estadoModeracion': null } ] }")
    List<ReporteCiudadanoDocumento> findPendientesIncluyendoNulo(String pendiente);

    /** Base de la reconciliación de LimpiezaFotosHuerfanasJob — toda foto legítimamente referenciada. */
    List<ReporteCiudadanoDocumento> findByFotoUrlIsNotNull();

    /** Candidatos a PurgaEvidenciaAntiguaJob (retención). */
    List<ReporteCiudadanoDocumento> findByFotoUrlIsNotNullAndTimestampBefore(Instant limite);
}
