package com.aguavigia.ctg.infrastructure.ingest;

import java.time.Instant;
import java.util.List;

/**
 * Estrategia común a todos los colectores del pipeline (pipeline-ingesta-datos.md §3). Vive en
 * infrastructure/, no en domain/port/out: opera sobre DocumentoCrudo, y ADR-017 ya decidió que
 * DocumentoCrudo queda fuera de domain/ a propósito — un puerto de dominio no puede depender de un
 * tipo de infraestructura sin romper la dirección de dependencias.
 */
public interface FuenteDatosPort {

    /** Documentos publicados o modificados después de {@code desde}, en orden cronológico ascendente. */
    List<DocumentoCrudo> obtenerDesde(Instant desde);
}
