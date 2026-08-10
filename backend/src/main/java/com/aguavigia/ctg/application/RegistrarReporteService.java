package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.LimiteReportesExcedidoException;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * RF005-RF008 — reportar sin registro, en máximo dos toques.
 *
 * RF006 (limitar reportes por dispositivo) lo hace este servicio, no el rate limiting HTTP
 * genérico: ese interceptor usa IP y no huella de dispositivo (ADR-018, decisión deliberada para
 * un problema distinto — fuerza bruta de login), así que dos dispositivos detrás del mismo NAT se
 * limitarían entre sí y uno con varias IPs no se limitaría nunca. Tampoco lo hace
 * ContadorReportesPort: ese ZSET alimenta el consenso (RF009-RF011) y a propósito no deduplica por
 * huella (ver su javadoc). Este servicio consulta ReporteCiudadanoRepository directamente antes de
 * guardar (BUG-032), con un conteo que a propósito no filtra por moderación (BUG-041): si filtrara
 * DESCARTADO, moderar a un spammer le reiniciaría el cupo.
 *
 * RF009: cada reporte dispara la evaluación de consenso de su sector — "automáticamente" no
 * significa "en un job aparte que alguien tiene que acordarse de programar".
 */
@Service
public class RegistrarReporteService implements RegistrarReporteUseCase {

    private final SectorRepository sectores;
    private final ReporteCiudadanoRepository reportes;
    private final ContadorReportesPort contadorReportes;
    private final EvaluarConsensoUseCase evaluarConsenso;
    private final RelojPort reloj;
    private final int limitePorDispositivo;
    private final Duration ventanaLimite;

    public RegistrarReporteService(SectorRepository sectores,
                                    ReporteCiudadanoRepository reportes,
                                    ContadorReportesPort contadorReportes,
                                    EvaluarConsensoUseCase evaluarConsenso,
                                    RelojPort reloj,
                                    @Value("${aguavigia.reportes.limite-por-dispositivo:3}") int limitePorDispositivo,
                                    @Value("${aguavigia.reportes.ventana-limite-minutos:30}") long ventanaLimiteMinutos) {
        this.sectores = sectores;
        this.reportes = reportes;
        this.contadorReportes = contadorReportes;
        this.evaluarConsenso = evaluarConsenso;
        this.reloj = reloj;
        this.limitePorDispositivo = limitePorDispositivo;
        this.ventanaLimite = Duration.ofMinutes(ventanaLimiteMinutos);
    }

    @Override
    public ReporteCiudadano registrar(SectorId sectorId, TipoReporte tipo, Coordenada coordenada, HuellaDispositivo huella) {
        sectores.buscarPorId(sectorId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el sector '" + sectorId.valor() + "'"));

        long reportesDelDispositivo = reportes.contarRecientesPorSectorYDispositivo(sectorId, ventanaLimite, huella);
        if (reportesDelDispositivo >= limitePorDispositivo) {
            throw new LimiteReportesExcedidoException(
                    "Ya reportaste %d veces en '%s' en los últimos %d minutos. Espera antes de volver a reportar."
                            .formatted(reportesDelDispositivo, sectorId.valor(), ventanaLimite.toMinutes()));
        }

        ReporteCiudadano reporte = new ReporteCiudadano(
                new ReporteId(UUID.randomUUID().toString()),
                sectorId,
                tipo,
                coordenada,
                huella,
                reloj.ahora());

        ReporteCiudadano guardado = reportes.guardar(reporte);
        contadorReportes.registrar(sectorId, huella);
        evaluarConsenso.evaluar(sectorId);
        return guardado;
    }
}
