package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EstrategiaConsenso;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.ResultadoConsenso;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.EvaluarConsensoUseCase;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * RF009-RF011 — cambia el estado de un sector cuando suficientes reportes independientes
 * coinciden en una ventana de tiempo. "Coinciden" no exige el mismo `TipoReporte` exacto: el
 * nuevo estado es el que sostiene la mayoría de los reportes recientes, para que un reporte
 * aislado de signo contrario no bloquee el consenso.
 */
@Service
public class EvaluarConsensoService implements EvaluarConsensoUseCase {

    private final SectorRepository sectores;
    private final ReporteCiudadanoRepository reportes;
    private final ContadorReportesPort contadorReportes;
    private final EstrategiaConsenso estrategia;
    private final EventoBitacoraRepository eventos;
    private final RelojPort reloj;
    private final Duration ventanaConsenso;

    public EvaluarConsensoService(SectorRepository sectores,
                                   ReporteCiudadanoRepository reportes,
                                   ContadorReportesPort contadorReportes,
                                   EstrategiaConsenso estrategia,
                                   EventoBitacoraRepository eventos,
                                   RelojPort reloj,
                                   @Value("${aguavigia.consenso.ventana-minutos:30}") long ventanaMinutos) {
        this.sectores = sectores;
        this.reportes = reportes;
        this.contadorReportes = contadorReportes;
        this.estrategia = estrategia;
        this.eventos = eventos;
        this.reloj = reloj;
        this.ventanaConsenso = Duration.ofMinutes(ventanaMinutos);
    }

    @Override
    public ResultadoConsenso evaluar(SectorId sectorId) {
        Sector sector = sectores.buscarPorId(sectorId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el sector '" + sectorId.valor() + "'"));

        long reportesRecientes = contadorReportes.contarRecientes(sectorId, ventanaConsenso);
        if (!estrategia.seAlcanzaConsenso(reportesRecientes, sector)) {
            return new ResultadoConsenso(sectorId, false, null, List.of());
        }

        List<ReporteCiudadano> sustento = reportes.listarRecientesPorSector(sectorId, ventanaConsenso);
        EstadoServicio nuevoEstado = estadoPorMayoria(sustento);

        // Sin cambio real de estado no hay evento nuevo que anexar a la bitácora (RF028: no editar,
        // pero tampoco duplicar un evento idéntico cada vez que alguien vuelve a evaluar el mismo sector).
        if (nuevoEstado == sector.estadoActual()) {
            return new ResultadoConsenso(sectorId, false, null, List.of());
        }

        sectores.guardar(sector.conEstado(nuevoEstado));

        List<ReporteId> ids = sustento.stream().map(ReporteCiudadano::id).toList();
        eventos.guardar(new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS,
                sectorId,
                null,
                reloj.ahora(),
                "%d reportes ciudadanos independientes confirmaron %s en '%s'"
                        .formatted(sustento.size(), nuevoEstado, sectorId.valor())));

        return new ResultadoConsenso(sectorId, true, nuevoEstado, ids);
    }

    private static EstadoServicio estadoPorMayoria(List<ReporteCiudadano> sustento) {
        Map<TipoReporte, Long> conteoPorTipo = sustento.stream()
                .collect(Collectors.groupingBy(ReporteCiudadano::tipo, Collectors.counting()));
        TipoReporte mayoritario = conteoPorTipo.entrySet().stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElseThrow(() -> new IllegalStateException("No hay reportes para sustentar el consenso"));
        return switch (mayoritario) {
            case SIN_AGUA -> EstadoServicio.SIN_SERVICIO;
            case PRESION_BAJA -> EstadoServicio.PRESION_BAJA;
            case SERVICIO_RESTABLECIDO -> EstadoServicio.CON_SERVICIO;
        };
    }
}
