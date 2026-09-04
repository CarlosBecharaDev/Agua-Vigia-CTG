package com.aguavigia.ctg.domain;

public record AuditoriaId(String valor) {

    public AuditoriaId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de auditoría no puede estar vacío");
        }
    }
}
