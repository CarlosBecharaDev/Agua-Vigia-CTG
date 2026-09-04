package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * RF026-028 — inmutable, solo anexado. La creación de negocio pasa siempre por
 * {@link EventoBitacoraFactory}, nunca por este constructor directamente. La única excepción es
 * {@code EventoBitacoraMongoAdapter.aDominio()} (infrastructure/persistence/mongo): ese código
 * rehidrata un evento que ya existió con su propio id, no crea uno nuevo, así que no tiene
 * sentido que pase por la factory. El constructor sigue siendo público porque el adaptador vive
 * en otro paquete y otra capa — restringir la visibilidad rompería esa reconstrucción legítima o
 * forzaría a mover el adaptador a domain/, violando Arquitectura Limpia. La regla se hace cumplir
 * con {@code ReglaDeOroArchitectureTest.eventoBitacoraSoloDebeCrearseDesdeLaFactoryODesdeElAdaptadorMongo}.
 */
public record EventoBitacora(
        EventoId id,
        TipoEvento tipo,
        SectorId sectorId,
        CorteId corteId,
        Instant timestamp,
        String descripcion,
        /**
         * Qué estado del servicio afirma este evento. Nulo cuando el evento no habla del servicio.
         * Sin él, la bitácora pública no puede darle color ni filtro a un evento y todo se lista
         * como "informativo", que es lo que un vecino no sabe leer.
         */
        EstadoServicio estado,
        /**
         * Boletín o nota que respalda el evento, cuando lo hay. Es lo que permite enseñar la fuente
         * —`ADR-006` exige que toda extracción sea contrastable— y de paso su portada.
         */
        String urlOriginal,
        /** Portada del boletín que respalda el evento, cuando la fuente la trae. */
        String imagenUrl) {

    /** Para los eventos que no afirman un estado del servicio ni citan una fuente externa. */
    public EventoBitacora(EventoId id, TipoEvento tipo, SectorId sectorId, CorteId corteId,
                           Instant timestamp, String descripcion) {
        this(id, tipo, sectorId, corteId, timestamp, descripcion, null, null, null);
    }

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
