package com.aguavigia.ctg.domain;

import java.time.Instant;

public record ReporteCiudadano(
        ReporteId id,
        SectorId sectorId,
        TipoReporte tipo,
        Coordenada coordenada,
        HuellaDispositivo huella,
        Instant timestamp) {

    public ReporteCiudadano {
        if (sectorId == null) {
            throw new IllegalArgumentException("El reporte debe estar asociado a un sector");
        }
        if (tipo == null) {
            throw new IllegalArgumentException("El reporte debe tener un tipo");
        }
        if (huella == null) {
            throw new IllegalArgumentException("El reporte debe traer huella de dispositivo (ADR-007)");
        }
        if (timestamp == null) {
            throw new IllegalArgumentException("El reporte debe tener timestamp");
        }
    }
}
