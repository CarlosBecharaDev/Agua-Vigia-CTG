package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/** M9 — cola de revisión de la ingesta automatizada. Ver {@code PropuestaIngesta}. */
@Getter
@Setter
@Document(collection = "propuestas_ingesta")
public class PropuestaIngestaDocumento {

    @Id
    private String id;

    @Indexed
    private String sectorId;

    private String estadoPropuesto;
    private String fuente;
    private String urlOriginal;
    private String citaTextual;
    private double confianza;
    private Instant detectadaEn;

    /** PENDIENTE, APROBADA o DESCARTADA. */
    @Indexed
    private String estadoRevision;

    /** Ventana que el boletín prometió. Nulas cuando el texto no la declaraba: no se estima. */
    private Instant inicioDeclarado;
    private Instant finPrometido;
}
