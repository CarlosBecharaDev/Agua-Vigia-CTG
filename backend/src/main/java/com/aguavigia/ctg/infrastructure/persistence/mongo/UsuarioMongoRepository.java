package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UsuarioMongoRepository extends MongoRepository<UsuarioDocumento, String> {

    Optional<UsuarioDocumento> findByCorreo(String correo);

    boolean existsByCorreo(String correo);

    Page<UsuarioDocumento> findByEstado(String estado, Pageable pageable);

    long countByRolAndEstado(String rol, String estado);
}
