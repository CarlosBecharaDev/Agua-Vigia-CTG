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

    /** RF013 — el token de confirmación es de un solo uso: se rechaza confirmar algo que no esté pendiente. */
    public Suscripcion confirmar() {
        if (estado != EstadoSuscripcion.PENDIENTE_CONFIRMACION) {
            throw new IllegalArgumentException("La suscripción ya no está pendiente de confirmación");
        }
        return new Suscripcion(id, correo, sectorIds, EstadoSuscripcion.CONFIRMADA, tokenConfirmacion, creadaEn);
    }

    /**
     * RF015 — la baja es idempotente a propósito: un vecino puede volver a abrir un correo viejo
     * o un enlace ya usado, y cancelar algo ya cancelado no debe ser un error sino la misma respuesta.
     */
    public Suscripcion cancelar() {
        if (estado == EstadoSuscripcion.CANCELADA) {
            return this;
        }
        return new Suscripcion(id, correo, sectorIds, EstadoSuscripcion.CANCELADA, tokenConfirmacion, creadaEn);
    }
}
