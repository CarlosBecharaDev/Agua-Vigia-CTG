package com.aguavigia.ctg.domain;

public record HuellaDispositivo(String hash) {

    public HuellaDispositivo {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("La huella de dispositivo no puede estar vacía");
        }
    }
}
