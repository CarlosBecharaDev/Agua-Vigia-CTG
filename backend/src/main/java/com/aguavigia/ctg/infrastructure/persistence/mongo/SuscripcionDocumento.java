package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Document(collection = "suscripciones")
public class SuscripcionDocumento {

    /** El id de dominio (UUID generado por SuscribirseService) hace también de _id de Mongo. */
    @Id
    private String id;

    private String correo;
    private List<String> sectorIds;
    private String estado;
    private String tokenConfirmacion;
    private Instant creadaEn;
}
