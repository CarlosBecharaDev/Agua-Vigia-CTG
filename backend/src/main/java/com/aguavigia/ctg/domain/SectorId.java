package com.aguavigia.ctg.domain;

public record SectorId(String valor) {

    public SectorId {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El id de sector no puede estar vacío");
        }
    }
}
