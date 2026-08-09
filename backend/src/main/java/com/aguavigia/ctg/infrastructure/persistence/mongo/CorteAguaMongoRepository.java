package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CorteAguaMongoRepository extends MongoRepository<CorteAguaDocumento, String> {

    List<CorteAguaDocumento> findBySectoresAfectadosContaining(String sectorId);
}
