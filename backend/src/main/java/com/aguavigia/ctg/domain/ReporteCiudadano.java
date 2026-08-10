package com.aguavigia.ctg.domain;

import java.time.Instant;

public record ReporteCiudadano(
        ReporteId id,
        SectorId sectorId,
        TipoReporte tipo,
        Coordenada coordenada,
        HuellaDispositivo huella,
        Instant timestamp,
        EstadoModeracion estadoModeracion,
        String fotoUrl,
        java.util.Set<String> huellasConfirmacion) {

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
        if (huellasConfirmacion == null) {
            huellasConfirmacion = java.util.Collections.emptySet();
        } else {
            huellasConfirmacion = java.util.Collections.unmodifiableSet(new java.util.HashSet<>(huellasConfirmacion));
        }
    }

    /** RF005-RF008: un reporte recién creado siempre nace PENDIENTE de moderación (RF018, `ADR-023`). */
    public ReporteCiudadano(ReporteId id, SectorId sectorId, TipoReporte tipo, Coordenada coordenada,
                             HuellaDispositivo huella, Instant timestamp) {
        this(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.PENDIENTE, null, java.util.Collections.emptySet());
    }

    public ReporteCiudadano(ReporteId id, SectorId sectorId, TipoReporte tipo, Coordenada coordenada,
                             HuellaDispositivo huella, Instant timestamp, EstadoModeracion estadoModeracion) {
        this(id, sectorId, tipo, coordenada, huella, timestamp, estadoModeracion, null, java.util.Collections.emptySet());
    }

    public ReporteCiudadano(ReporteId id, SectorId sectorId, TipoReporte tipo, Coordenada coordenada,
                             HuellaDispositivo huella, Instant timestamp, EstadoModeracion estadoModeracion, String fotoUrl) {
        this(id, sectorId, tipo, coordenada, huella, timestamp, estadoModeracion, fotoUrl, java.util.Collections.emptySet());
    }

    /** RF018 — idempotente: aprobar un reporte ya aprobado, o cambiar de un descarte a aprobado, no falla. */
    public ReporteCiudadano aprobar() {
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.APROBADO, fotoUrl, huellasConfirmacion);
    }

    /** RF018 — idempotente, igual que {@link #aprobar()}. */
    public ReporteCiudadano descartar() {
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, EstadoModeracion.DESCARTADO, fotoUrl, huellasConfirmacion);
    }

    public ReporteCiudadano conFoto(String fotoUrl) {
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, estadoModeracion, fotoUrl, huellasConfirmacion);
    }

    public ReporteCiudadano confirmar(HuellaDispositivo huellaConfirmacion) {
        if (this.huella.equals(huellaConfirmacion) || this.huellasConfirmacion.contains(huellaConfirmacion.hash())) {
            return this;
        }
        java.util.Set<String> nuevas = new java.util.HashSet<>(this.huellasConfirmacion);
        nuevas.add(huellaConfirmacion.hash());
        return new ReporteCiudadano(id, sectorId, tipo, coordenada, huella, timestamp, estadoModeracion, fotoUrl, nuevas);
    }

    public int numeroConfirmaciones() {
        return huellasConfirmacion.size();
    }
}
