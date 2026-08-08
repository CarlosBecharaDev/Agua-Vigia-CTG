package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * Repositorio de Spring Data. No sale de infrastructure/: quien lo consume es
 * SectorMongoAdapter, que es el que implementa el puerto de dominio.
 */
public interface SectorMongoRepository extends MongoRepository<SectorDocumento, String> {

    Optional<SectorDocumento> findBySlug(String slug);
}
