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
        EstadoServicio nuevoEstado = estadoPorMayoria(sustento, sector.estadoActual());

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

    // Empate entre tipos de reporte = evidencia ambigua, no motivo para cambiar el estado publicado
    // (CLAUDE.md, ética de datos: nada se publica sin poder sustentarlo). El orden de iteración de
    // un HashMap sobre una enum no está garantizado por el JLS, así que resolver el empate por el
    // primer máximo encontrado no era determinista — quedaba a merced del hashing de la JVM.
    private static EstadoServicio estadoPorMayoria(List<ReporteCiudadano> sustento, EstadoServicio estadoActual) {
        Map<TipoReporte, Long> conteoPorTipo = sustento.stream()
                .collect(Collectors.groupingBy(ReporteCiudadano::tipo, Collectors.counting()));
        long maximo = conteoPorTipo.values().stream()
                .mapToLong(Long::longValue)
                .max()
                .orElseThrow(() -> new IllegalStateException("No hay reportes para sustentar el consenso"));
        List<TipoReporte> mayoritarios = conteoPorTipo.entrySet().stream()
                .filter(entrada -> entrada.getValue() == maximo)
                .map(Map.Entry::getKey)
                .toList();
        if (mayoritarios.size() > 1) {
            return estadoActual;
        }
        return switch (mayoritarios.get(0)) {
            case SIN_AGUA -> EstadoServicio.SIN_SERVICIO;
            case PRESION_BAJA -> EstadoServicio.PRESION_BAJA;
            case SERVICIO_RESTABLECIDO -> EstadoServicio.CON_SERVICIO;
        };
    }
}
