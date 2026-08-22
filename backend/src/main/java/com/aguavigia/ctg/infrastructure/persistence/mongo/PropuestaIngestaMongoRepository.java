package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PropuestaIngestaMongoRepository extends MongoRepository<PropuestaIngestaDocumento, String> {

    Page<PropuestaIngestaDocumento> findByEstadoRevision(String estadoRevision, Pageable paginacion);

    boolean existsBySectorIdAndEstadoPropuestoAndEstadoRevision(
            String sectorId, String estadoPropuesto, String estadoRevision);
}
