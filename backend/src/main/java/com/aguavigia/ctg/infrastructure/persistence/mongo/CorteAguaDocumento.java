package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Document(collection = "cortes")
public class CorteAguaDocumento {

    @Id
    private String id;

    @Indexed
    private List<String> sectoresAfectados;

    private Instant inicio;
    private Instant finPrometido;

    /** Nulo mientras el corte sigue abierto — RF017 lo cierra con la hora real. */
    private Instant finReal;

    private String causa;
    private String origen;
    private String estado;
}
