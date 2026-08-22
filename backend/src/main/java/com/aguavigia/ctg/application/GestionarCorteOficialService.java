package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.GestionarCorteOficialUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.Suscripcion;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * RF016-RF017 — el veedor registra un corte oficial y lo cierra con la hora real de
 * restablecimiento. `CorteAgua` llega ya construido (el `Builder` del dominio impone sus propias
 * invariantes, como `RegistrarReporteService` deja que el constructor de `ReporteCiudadano`
 * imponga las suyas); este servicio solo aporta la regla que cruza agregados: los sectores
 * afectados tienen que existir.
 *
 * RF026: cada registro y cada cierre anexan un evento a la bitácora pública — uno por sector
 * afectado, porque `EventoBitacora.sectorId` es singular y un corte puede tocar varios sectores a
 * la vez. Misma dependencia de `RegistrarEventoBitacoraUseCase` que `RegistrarReporteService` usa
 * para `EvaluarConsensoUseCase`: un caso de uso dispara a otro, no a su repositorio directamente.
 */
@Service
public class GestionarCorteOficialService implements GestionarCorteOficialUseCase {

    private final CorteAguaRepository cortes;
    private final SectorRepository sectores;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;
    private final SuscripcionRepository suscripciones;
    private final NotificacionPort notificador;

    public GestionarCorteOficialService(CorteAguaRepository cortes,
                                         SectorRepository sectores,
                                         RegistrarEventoBitacoraUseCase registrarEvento,
                                         RelojPort reloj,
                                         SuscripcionRepository suscripciones,
                                         NotificacionPort notificador) {
        this.cortes = cortes;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
        this.suscripciones = suscripciones;
        this.notificador = notificador;
    }

    @Override
    public CorteAgua registrar(CorteAgua corte) {
        for (SectorId sectorId : corte.sectoresAfectados()) {
            sectores.buscarPorId(sectorId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No existe el sector '" + sectorId.valor() + "'"));
        }

        CorteAgua guardado = cortes.guardar(corte);
        for (SectorId sectorId : guardado.sectoresAfectados()) {
            registrarEvento.registrar(EventoBitacoraFactory.corteAnunciado(guardado, sectorId, reloj.ahora()));
            sectores.buscarPorId(sectorId).ifPresent(sector -> {
                List<Suscripcion> afectadas = suscripciones.buscarConfirmadasPorSector(sectorId);
                for (Suscripcion s : afectadas) {
                    notificador.avisarCambioDeEstado(s, sector);
                }
            });
        }
        return guardado;
    }

    @Override
    public CorteAgua cerrar(CorteId corteId, Instant horaReal) {
        CorteAgua corte = cortes.buscarPorId(corteId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el corte '" + corteId.valor() + "'"));

        CorteAgua cerrado = corte.cerrar(horaReal);

        CorteAgua guardado = cortes.guardar(cerrado);
        for (SectorId sectorId : guardado.sectoresAfectados()) {
            registrarEvento.registrar(EventoBitacoraFactory.corteRestablecido(guardado, sectorId, reloj.ahora()));
            sectores.buscarPorId(sectorId).ifPresent(sector -> {
                List<Suscripcion> afectadas = suscripciones.buscarConfirmadasPorSector(sectorId);
                for (Suscripcion s : afectadas) {
                    notificador.avisarCambioDeEstado(s, sector);
                }
            });
        }
        return guardado;
    }
}
