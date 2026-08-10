package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SuscripcionMongoRepository extends MongoRepository<SuscripcionDocumento, String> {

    Optional<SuscripcionDocumento> findByTokenConfirmacion(String token);

    List<SuscripcionDocumento> findBySectorIdsContainingAndEstado(String sectorId, String estado);
}
