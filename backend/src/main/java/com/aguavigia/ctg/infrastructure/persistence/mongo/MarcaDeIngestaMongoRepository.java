package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface MarcaDeIngestaMongoRepository extends MongoRepository<MarcaDeIngestaDocumento, String> {
}
