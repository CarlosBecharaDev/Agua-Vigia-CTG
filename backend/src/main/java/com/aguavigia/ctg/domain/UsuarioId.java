package com.aguavigia.ctg.domain;

public record UsuarioId(String valor) {

    public UsuarioId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de usuario no puede estar vacío");
        }
    }
}
