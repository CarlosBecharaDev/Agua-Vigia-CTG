package com.aguavigia.ctg.api.dto;

public record IotPresionRequest(
    String sensorId,
    String sectorId,
    Double presionPsi,
    IotCoordenada coordenada
) {}
