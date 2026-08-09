package com.aguavigia.ctg.domain;

/**
 * poblacion es nulable: 27 de 213 barrios de Cartagena no tienen dato censal (corregimientos
 * rurales/insulares que el DANE no cubre). Ver docs/ingenieria/modelo-de-dominio.md §3.1 —
 * un 0 sería indistinguible de un barrio real sin habitantes.
 */
public record Sector(SectorId id, String nombre, Integer poblacion, EstadoServicio estadoActual) {

    public Sector {
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El nombre del sector no puede estar vacío");
        }
        if (poblacion != null && poblacion < 0) {
            throw new IllegalArgumentException("La población no puede ser negativa");
        }
    }

    public Sector conEstado(EstadoServicio nuevoEstado) {
        return new Sector(id, nombre, poblacion, nuevoEstado);
    }
}
