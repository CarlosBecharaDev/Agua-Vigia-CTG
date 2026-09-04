package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface PropuestaIngestaMongoRepository extends MongoRepository<PropuestaIngestaDocumento, String> {

    Page<PropuestaIngestaDocumento> findByEstadoRevision(String estadoRevision, Pageable paginacion);

    boolean existsBySectorIdAndEstadoPropuestoAndEstadoRevision(
            String sectorId, String estadoPropuesto, String estadoRevision);

    /** Aprobadas con ventana declarada que aún no ha caducado del todo. */
    List<PropuestaIngestaDocumento> findByEstadoRevisionAndInicioDeclaradoNotNullAndFinPrometidoGreaterThanEqual(
            String estadoRevision, Instant finDesde);
}
