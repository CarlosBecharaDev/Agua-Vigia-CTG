package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SuscripcionMongoRepository extends MongoRepository<SuscripcionDocumento, String> {
}
