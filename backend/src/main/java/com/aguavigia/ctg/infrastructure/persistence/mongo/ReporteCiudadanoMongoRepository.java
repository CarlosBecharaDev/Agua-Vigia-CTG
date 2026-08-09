package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface ReporteCiudadanoMongoRepository extends MongoRepository<ReporteCiudadanoDocumento, String> {

    List<ReporteCiudadanoDocumento> findBySectorIdAndTimestampGreaterThanEqual(String sectorId, Instant desde);
}
