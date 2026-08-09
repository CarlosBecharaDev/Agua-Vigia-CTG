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

    /** RF013 — doble opt-in: de PENDIENTE_CONFIRMACION a CONFIRMADA. Idempotente si ya estaba confirmada. */
    public Suscripcion confirmar() {
        if (estado == EstadoSuscripcion.CANCELADA) {
            throw new IllegalStateException("No se puede confirmar una suscripción ya cancelada");
        }
        return new Suscripcion(id, correo, sectorIds, EstadoSuscripcion.CONFIRMADA, tokenConfirmacion, creadaEn);
    }

    /** RF015 — baja en 1 clic, sin pedir credenciales. Idempotente si ya estaba cancelada. */
    public Suscripcion cancelar() {
        return new Suscripcion(id, correo, sectorIds, EstadoSuscripcion.CANCELADA, tokenConfirmacion, creadaEn);
    }
}
