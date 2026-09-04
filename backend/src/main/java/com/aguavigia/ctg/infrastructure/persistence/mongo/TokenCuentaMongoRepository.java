package com.aguavigia.ctg.infrastructure.persistence.mongo;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TokenCuentaMongoRepository extends MongoRepository<TokenCuentaDocumento, String> {

    List<TokenCuentaDocumento> findByUsuarioIdAndTipoAndUsadoEnIsNull(String usuarioId, String tipo);
}
