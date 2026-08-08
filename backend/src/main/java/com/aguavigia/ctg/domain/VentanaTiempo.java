package com.aguavigia.ctg.domain;

import java.time.Instant;

public record VentanaTiempo(Instant inicio, Instant finPrometido, Instant finReal) {

    public VentanaTiempo {
        if (inicio == null || finPrometido == null) {
            throw new IllegalArgumentException("Inicio y fin prometido son obligatorios");
        }
        if (!finPrometido.isAfter(inicio)) {
            throw new IllegalArgumentException("El fin prometido debe ser posterior al inicio");
        }
        if (finReal != null && finReal.isBefore(inicio)) {
            throw new IllegalArgumentException("El fin real no puede preceder al inicio");
        }
    }

    public VentanaTiempo(Instant inicio, Instant finPrometido) {
        this(inicio, finPrometido, null);
    }

    public boolean estaCerrada() {
        return finReal != null;
    }
}
