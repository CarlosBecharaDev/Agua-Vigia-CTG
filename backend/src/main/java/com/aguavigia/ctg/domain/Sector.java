package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * poblacion es nulable: 27 de 213 barrios de Cartagena no tienen dato censal (corregimientos
 * rurales/insulares que el DANE no cubre). Ver docs/ingenieria/modelo-de-dominio.md §3.1 —
 * un 0 sería indistinguible de un barrio real sin habitantes.
 *
 * RF003 — {@code estadoActualizadoEn} es cuándo se registró {@code estadoActual}, y es lo que
 * permite mostrar "actualizado hace X" junto a cada sector (DESIGN.md §6: un mapa congelado
 * mostrando datos viejos como actuales es peor que uno que admite que no sabe). Nulo mientras el
 * sector no tenga estado registrado.
 *
 * Quien lo escribe es {@code SectorMongoAdapter.guardar()}, con {@link
 * com.aguavigia.ctg.domain.port.out.RelojPort}, y no {@link #conEstado(EstadoServicio)}: así hay un
 * solo reloj decidiendo la marca de tiempo de un cambio de estado. La consecuencia es que un Sector
 * recién derivado con {@code conEstado()} conserva en memoria la marca anterior hasta que se guarda
 * y se relee — el {@code SectorActualizadoEvent} que publica el adaptador sí viaja con la nueva,
 * porque se construye desde el documento ya guardado.
 */
public record Sector(SectorId id, String nombre, Integer poblacion, EstadoServicio estadoActual,
                     Instant estadoActualizadoEn) {

    public Sector {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre del sector no puede estar vacío");
        }
        if (poblacion != null && poblacion < 0) {
            throw new IllegalArgumentException("La población no puede ser negativa");
        }
    }

    /** Sector sin marca de tiempo conocida — la pone el adaptador al persistir el cambio de estado. */
    public Sector(SectorId id, String nombre, Integer poblacion, EstadoServicio estadoActual) {
        this(id, nombre, poblacion, estadoActual, null);
    }

    public Sector conEstado(EstadoServicio nuevoEstado) {
        return new Sector(id, nombre, poblacion, nuevoEstado, estadoActualizadoEn);
    }
}
