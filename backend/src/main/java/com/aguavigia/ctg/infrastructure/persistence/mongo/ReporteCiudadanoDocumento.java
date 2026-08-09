package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document(collection = "reportes")
public class ReporteCiudadanoDocumento {

    @Id
    private String id;

    @Indexed
    private String sectorId;

    private String tipo;
    private Double latitud;
    private Double longitud;
    private String huella;

    @Indexed
    private Instant timestamp;
}
