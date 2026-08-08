package com.aguavigia.ctg.domain;

public record Coordenada(double latitud, double longitud) {

    public Coordenada {
        if (latitud < -90 || latitud > 90) {
            throw new IllegalArgumentException("Latitud fuera de rango: " + latitud);
        }
        if (longitud < -180 || longitud > 180) {
            throw new IllegalArgumentException("Longitud fuera de rango: " + longitud);
        }
    }
}
