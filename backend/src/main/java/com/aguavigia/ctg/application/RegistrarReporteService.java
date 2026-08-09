package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * RF005-RF008 — reportar sin registro, en máximo dos toques. La limitación de reportes por
 * dispositivo (RF006) no la hace este servicio: es el rate limiting HTTP en el borde
 * (`RedisContadorReportesAdapter`, comentario de clase), para no mezclar dos controles en una
 * sola estructura. Este servicio sí alimenta el contador — es el insumo que `EvaluarConsensoUseCase`
 * (RF009-RF011) va a leer, todavía sin implementar.
 */
@Service
public class RegistrarReporteService implements RegistrarReporteUseCase {

    private final SectorRepository sectores;
    private final ReporteCiudadanoRepository reportes;
    private final ContadorReportesPort contadorReportes;
    private final RelojPort reloj;

    public RegistrarReporteService(SectorRepository sectores,
                                    ReporteCiudadanoRepository reportes,
                                    ContadorReportesPort contadorReportes,
                                    RelojPort reloj) {
        this.sectores = sectores;
        this.reportes = reportes;
        this.contadorReportes = contadorReportes;
        this.reloj = reloj;
    }

    @Override
    public ReporteCiudadano registrar(SectorId sectorId, TipoReporte tipo, Coordenada coordenada, HuellaDispositivo huella) {
        sectores.buscarPorId(sectorId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el sector '" + sectorId.valor() + "'"));

        ReporteCiudadano reporte = new ReporteCiudadano(
                new ReporteId(UUID.randomUUID().toString()),
                sectorId,
                tipo,
                coordenada,
                huella,
                reloj.ahora());

        ReporteCiudadano guardado = reportes.guardar(reporte);
        contadorReportes.registrar(sectorId, huella);
        return guardado;
    }
}
