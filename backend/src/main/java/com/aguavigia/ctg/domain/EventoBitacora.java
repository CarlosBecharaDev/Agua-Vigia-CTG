package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * RF026-028 — inmutable, solo anexado. La restricción de crearse únicamente vía Factory Method
 * (docs/ingenieria/modelo-de-dominio.md) es tarea de Sprint 4; por ahora es un record validado
 * en construcción, que es la protección real contra un evento inconsistente.
 */
public record EventoBitacora(
        EventoId id,
        TipoEvento tipo,
        SectorId sectorId,
        CorteId corteId,
        Instant timestamp,
        String descripcion) {

    public EventoBitacora {
        if (tipo == null) {
            throw new IllegalArgumentException("El evento debe tener un tipo");
        }
        if (timestamp == null) {
            throw new IllegalArgumentException("El evento debe tener timestamp");
        }
        if (descripcion == null || descripcion.isBlank()) {
            throw new IllegalArgumentException("El evento debe tener descripción");
        }
    }
}
