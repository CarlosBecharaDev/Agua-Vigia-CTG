package com.aguavigia.ctg.domain;

public record CorteId(String valor) {

    public CorteId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de corte no puede estar vacío");
        }
    }
}
