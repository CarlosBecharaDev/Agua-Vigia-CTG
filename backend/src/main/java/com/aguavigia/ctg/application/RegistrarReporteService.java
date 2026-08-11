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
 * limitarían entre sí y uno con varias IPs no se limitaría nunca.
 *
 * El cupo se reserva de forma atómica en Redis (`intentarReservarCupo`) y no contando en Mongo
 * antes de guardar: entre la consulta y la escritura cabían dos peticiones simultáneas del mismo
 * dispositivo, y ambas pasaban. Mongo en instancia única no ofrece transacciones multi-documento
 * con las que cerrar esa ventana; un INCR sí es atómico. Sigue siendo una llave distinta de la del
 * consenso: ese ZSET alimenta RF009-RF011 y a propósito no deduplica por huella, y mezclar ambos
 * controles haría que cambiar uno rompiera el otro sin avisar.
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
    private final int limitePorSensor;
    private final Duration ventanaLimite;

    public RegistrarReporteService(SectorRepository sectores,
                                    ReporteCiudadanoRepository reportes,
                                    ContadorReportesPort contadorReportes,
                                    EvaluarConsensoUseCase evaluarConsenso,
                                    RelojPort reloj,
                                    @Value("${aguavigia.reportes.limite-por-dispositivo:3}") int limitePorDispositivo,
                                    @Value("${aguavigia.reportes.limite-por-sensor:30}") int limitePorSensor,
                                    @Value("${aguavigia.reportes.ventana-limite-minutos:30}") long ventanaLimiteMinutos) {
        this.sectores = sectores;
        this.reportes = reportes;
        this.contadorReportes = contadorReportes;
        this.evaluarConsenso = evaluarConsenso;
        this.reloj = reloj;
        this.limitePorDispositivo = limitePorDispositivo;
        this.limitePorSensor = limitePorSensor;
        this.ventanaLimite = Duration.ofMinutes(ventanaLimiteMinutos);
    }

    @Override
    public ReporteCiudadano registrar(SectorId sectorId, TipoReporte tipo, Coordenada coordenada, HuellaDispositivo huella) {
        sectores.buscarPorId(sectorId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el sector '" + sectorId.valor() + "'"));

        // Un sensor de M13 y un celular anónimo no son el mismo actor: el sensor se autentica con
        // X-IoT-Key y reporta cada pocos minutos por diseño, así que con el cupo ciudadano se
        // autobloqueaba al cuarto envío y el endpoint le devolvía 429. RF006 existe para frenar a
        // quien infla el conteo sin identificarse, no a la telemetría.
        int limite = huella.esDeSensor() ? limitePorSensor : limitePorDispositivo;

        // Dos guardas con propiedades distintas, y hacen falta las dos:
        //
        // 1. Mongo es la verdad duradera. Sobrevive a un reinicio de Redis, que si no borraria
        //    todos los cupos de golpe. A proposito no filtra por moderacion (BUG-041): si filtrara
        //    DESCARTADO, moderar a un spammer le reiniciaria el cupo.
        // 2. Redis cierra la ventana de carrera. Entre contar en Mongo y guardar el reporte caben
        //    dos peticiones simultaneas del mismo dispositivo que leen el mismo conteo y pasan las
        //    dos; INCR es atomico y Mongo en instancia unica no da transacciones multi-documento.
        //
        // Mongo va primero para no gastar un cupo de Redis en una peticion que ya iba a rechazarse.
        long yaReportados = reportes.contarRecientesPorSectorYDispositivo(sectorId, ventanaLimite, huella);
        if (yaReportados >= limite || !contadorReportes.intentarReservarCupo(sectorId, huella, limite, ventanaLimite)) {
            throw new LimiteReportesExcedidoException(
                    "Ya reportaste %d veces en '%s' en los últimos %d minutos. Espera antes de volver a reportar."
                            .formatted(Math.max(yaReportados, limite), sectorId.valor(), ventanaLimite.toMinutes()));
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
