package com.aguavigia.ctg.domain;

public record SuscripcionId(String valor) {

    public SuscripcionId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de suscripción no puede estar vacío");
        }
    }
}
