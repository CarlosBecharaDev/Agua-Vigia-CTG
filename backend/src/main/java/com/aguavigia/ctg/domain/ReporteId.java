package com.aguavigia.ctg.domain;

public record ReporteId(String valor) {

    public ReporteId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de reporte no puede estar vacío");
        }
    }
}
