package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SuscripcionMongoRepository extends MongoRepository<SuscripcionDocumento, String> {

    /** RF013-RF015 — el enlace del correo trae el token; MongoDB indexa este campo en la colección. */
    Optional<SuscripcionDocumento> findByTokenConfirmacion(String tokenConfirmacion);
}
