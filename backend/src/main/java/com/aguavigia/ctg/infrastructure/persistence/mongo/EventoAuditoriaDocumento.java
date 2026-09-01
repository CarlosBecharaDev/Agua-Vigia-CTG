package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document(collection = "auditoria_cuentas")
public class EventoAuditoriaDocumento {

    @Id
    private String id;

    private String accion;
    private String autorId;
    private String autorCorreo;
    private String sujetoId;
    private String sujetoCorreo;
    private String detalle;
    private String ip;
    private Instant ocurrioEn;
}
