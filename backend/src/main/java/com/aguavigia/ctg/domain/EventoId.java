package com.aguavigia.ctg.domain;

public record EventoId(String valor) {

    public EventoId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de evento no puede estar vacío");
        }
    }
}
