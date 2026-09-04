package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * M9 — hasta qué fecha leyó cada colector. Un documento por fuente, con el nombre de la fuente
 * como `_id`.
 *
 * No pasa por un puerto de dominio a propósito: es contabilidad del pipeline, no una regla del
 * acueducto — el mismo criterio que {@code EstadoColectorRegistry} ya documenta. La diferencia es
 * que esta marca sí tiene que sobrevivir al reinicio, y por eso vive en Mongo y no en memoria.
 */
@Getter
@Setter
@Document(collection = "marcas_ingesta")
public class MarcaDeIngestaDocumento {

    /** Nombre del colector: `acuacar`, `rss`. */
    @Id
    private String fuente;

    /** Fecha de publicación del boletín más reciente ya procesado por esta fuente. */
    private Instant ultimoPublicadoEn;

    public MarcaDeIngestaDocumento() {
    }

    public MarcaDeIngestaDocumento(String fuente, Instant ultimoPublicadoEn) {
        this.fuente = fuente;
        this.ultimoPublicadoEn = ultimoPublicadoEn;
    }
}
