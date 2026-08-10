package com.aguavigia.ctg.api.dto;

public record IotPresionRequest(
    String sensorId,
    Double presionPsi,
    IotCoordenada coordenada
) {}
