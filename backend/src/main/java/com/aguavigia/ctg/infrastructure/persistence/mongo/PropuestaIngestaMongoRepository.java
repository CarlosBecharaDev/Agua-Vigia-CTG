package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PropuestaIngestaMongoRepository extends MongoRepository<PropuestaIngestaDocumento, String> {

    List<PropuestaIngestaDocumento> findByEstadoRevision(String estadoRevision, Sort orden);

    boolean existsBySectorIdAndEstadoPropuestoAndEstadoRevision(
            String sectorId, String estadoPropuesto, String estadoRevision);
}
