package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * El `_id` es el hash del token, no un UUID aparte: la búsqueda siempre es por hash, y usarlo como
 * clave primaria hace imposible que existan dos filas para el mismo enlace.
 */
@Getter
@Setter
@Document(collection = "tokens_cuenta")
public class TokenCuentaDocumento {

    @Id
    private String hash;

    private String tipo;

    @Indexed
    private String usuarioId;

    private Instant creadoEn;
    private Instant usadoEn;

    /**
     * TTL de Mongo: la propia base borra el documento pasada la fecha. Un token caducado ya no vale
     * (TokenCuenta.estaVigente lo comprueba), así que conservarlo solo acumula hashes indefinidamente.
     */
    private Instant expiraEn;
}
