package com.aguavigia.ctg.domain;

public record PropuestaId(String valor) {

    public PropuestaId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de propuesta no puede estar vacío");
        }
    }
}
