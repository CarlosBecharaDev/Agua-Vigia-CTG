package com.aguavigia.ctg.domain;

import java.time.Instant;

public record ReporteCiudadano(
        ReporteId id,
        SectorId sectorId,
        TipoReporte tipo,
        Coordenada coordenada,
        HuellaDispositivo huella,
        Instant timestamp,
        EstadoModeracion estadoModeracion) {

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
        if (estadoModeracion == null) {
            throw new IllegalArgumentException("El reporte debe tener un estado de moderación");
        }
    }

    /** RF005-RF008: un reporte recién creado siempre nace PENDIENTE de moderación (RF018, `ADR-023`). */
    public ReporteCiudadano(ReporteId id, SectorId sectorId, TipoReporte tipo, Coordenada coordenada,
                             HuellaDispositivo huella, Instant timestamp) {
        this(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.PENDIENTE);
    }

    /** RF018 — idempotente: aprobar un reporte ya aprobado, o cambiar de un descarte a aprobado, no falla. */
    public ReporteCiudadano aprobar() {
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.APROBADO);
    }

    /** RF018 — idempotente, igual que {@link #aprobar()}. */
    public ReporteCiudadano descartar() {
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.DESCARTADO);
    }
}
