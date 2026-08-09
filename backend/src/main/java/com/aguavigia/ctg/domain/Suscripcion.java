package com.aguavigia.ctg.domain;

import java.time.Instant;
import java.util.List;

/**
 * RF012-RF013 — un correo puede seguir varios sectores, pero nace en PENDIENTE_CONFIRMACION:
 * sin tokenConfirmacion no hay manera de que llegue a CONFIRMADA, así que el campo es obligatorio
 * incluso en ese primer estado.
 */
public record Suscripcion(
        SuscripcionId id,
        CorreoElectronico correo,
        List<SectorId> sectorIds,
        EstadoSuscripcion estado,
        String tokenConfirmacion,
        Instant creadaEn) {

    public Suscripcion {
        if (correo == null) {
            throw new IllegalArgumentException("La suscripción debe tener un correo");
        }
        if (sectorIds == null || sectorIds.isEmpty()) {
            throw new IllegalArgumentException("La suscripción debe tener al menos un sector");
        }
        if (estado == null) {
            throw new IllegalArgumentException("La suscripción debe tener un estado");
        }
        if (tokenConfirmacion == null || tokenConfirmacion.isBlank()) {
            throw new IllegalArgumentException("La suscripción debe tener un token de confirmación");
        }
        if (creadaEn == null) {
            throw new IllegalArgumentException("La suscripción debe tener fecha de creación");
        }
        sectorIds = List.copyOf(sectorIds);
    }
}
