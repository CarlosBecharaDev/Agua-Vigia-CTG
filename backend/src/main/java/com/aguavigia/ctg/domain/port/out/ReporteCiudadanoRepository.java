package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ReporteCiudadanoRepository {

    ReporteCiudadano guardar(ReporteCiudadano reporte);

    /** RF009-RF011 — sustento del consenso: excluye lo que el veedor ya descartó como spam. */
    List<ReporteCiudadano> listarRecientesPorSector(SectorId sectorId, Duration ventana);

    /**
     * RF006 — cupo de reportes por dispositivo. Cuenta TODO lo que el dispositivo envió en la
     * ventana, sin filtrar por moderación: que el veedor descarte un reporte de un abusador no
     * puede reiniciarle el cupo (BUG-041).
     */
    long contarRecientesPorSectorYDispositivo(SectorId sectorId, Duration ventana, HuellaDispositivo huella);

    Optional<ReporteCiudadano> buscarPorId(ReporteId id);

    /** RF018 — la cola de moderación del veedor. */
    List<ReporteCiudadano> listarPendientes();

    /**
     * Nombres de archivo (no URLs) de toda foto referenciada por algún reporte, sin importar su
     * estado de moderación — un reporte DESCARTADO sigue siendo dueño legítimo de su foto en
     * disco; eso no es una foto huérfana (ver LimpiezaFotosHuerfanasJob).
     */
    Set<String> listarNombresDeFotoReferenciados();

    /** Reportes con foto cuyo timestamp es anterior a {@code limite} — candidatos a purga de evidencia por retención. */
    List<ReporteCiudadano> listarConFotoAnterioresA(Instant limite);
}
