package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Adaptador mínimo — solo lo que EvaluarConsensoService necesita para anexar (RF011). El backend
 * completo de M8 (GET /api/bitacora, inmutabilidad append-only formal) es Sprint 3, capa de D1.
 */
@Getter
@Setter
@Document(collection = "eventos_bitacora")
public class EventoBitacoraDocumento {

    @Id
    private String id;

    private String tipo;
    private String sectorId;
    private String corteId;
    private Instant timestamp;
    private String descripcion;
}
