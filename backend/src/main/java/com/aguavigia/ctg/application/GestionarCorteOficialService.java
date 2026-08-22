package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.GestionarCorteOficialUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.function.Function;

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
 *
 * RF001: registrar o cerrar un corte también mueve el estado de los sectores afectados. Antes no
 * lo hacía, y `EstadoServicio.CORTE_PROGRAMADO` no se asignaba en ninguna parte del sistema: el
 * mapa no distinguía un corte anunciado de un barrio con servicio normal.
 */
@Service
public class GestionarCorteOficialService implements GestionarCorteOficialUseCase {

    private final CorteAguaRepository cortes;
    private final SectorRepository sectores;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;

    public GestionarCorteOficialService(CorteAguaRepository cortes,
                                         SectorRepository sectores,
                                         RegistrarEventoBitacoraUseCase registrarEvento,
                                         RelojPort reloj) {
        this.cortes = cortes;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
    }

    @Override
    public CorteAgua registrar(CorteAgua corte) {
        for (SectorId sectorId : corte.sectoresAfectados()) {
            sectores.buscarPorId(sectorId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No existe el sector '" + sectorId.valor() + "'"));
        }

        CorteAgua guardado = cortes.guardar(corte);
        // Un corte anunciado para dentro de tres días no deja el barrio sin agua hoy: es
        // CORTE_PROGRAMADO hasta que llega su hora. Si el veedor registra uno que ya empezó
        // (pasa: primero se corta el agua, después alguien lo anuncia), nace SIN_SERVICIO.
        EstadoServicio estado = guardado.ventana().inicio().isAfter(reloj.ahora())
                ? EstadoServicio.CORTE_PROGRAMADO
                : EstadoServicio.SIN_SERVICIO;
        anexarYMoverEstado(guardado, estado,
                sectorId -> EventoBitacoraFactory.corteAnunciado(guardado, sectorId, reloj.ahora()));
        return guardado;
    }

    @Override
    public CorteAgua cerrar(CorteId corteId, Instant horaReal) {
        CorteAgua corte = cortes.buscarPorId(corteId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el corte '" + corteId.valor() + "'"));

        CorteAgua cerrado = corte.cerrar(horaReal);

        CorteAgua guardado = cortes.guardar(cerrado);
        anexarYMoverEstado(guardado, EstadoServicio.CON_SERVICIO,
                sectorId -> EventoBitacoraFactory.corteRestablecido(guardado, sectorId, reloj.ahora()));
        return guardado;
    }

    /**
     * Anexa el evento a la bitácora y mueve el estado de cada sector afectado.
     *
     * No notifica suscriptores aquí: guardar el sector publica `SectorActualizadoEvent` y
     * `NotificarSuscripcionesService` es su único suscriptor. Este servicio recorría además las
     * suscripciones a mano, así que cada corte mandaba dos correos al mismo vecino — y con el
     * estado viejo, porque nadie estaba cambiando el sector: el aviso decía "cambió su estado a:
     * Desconocido" en cualquier barrio que todavía no tuviera estado registrado. Es la misma
     * corrección que se le hizo a `EvaluarConsensoService`.
     */
    private void anexarYMoverEstado(CorteAgua corte, EstadoServicio nuevoEstado,
                                     Function<SectorId, EventoBitacora> eventoDe) {
        for (SectorId sectorId : corte.sectoresAfectados()) {
            registrarEvento.registrar(eventoDe.apply(sectorId));
            EstadoServicio estadoReal = sinDegradarPorOtrosCortesAbiertos(sectorId, corte, nuevoEstado);
            sectores.buscarPorId(sectorId)
                    .filter(sector -> sector.estadoActual() != estadoReal)
                    .ifPresent(sector -> sectores.guardar(sector.conEstado(estadoReal)));
        }
    }

    /**
     * Un sector puede estar afectado por más de un corte a la vez (uno masivo, uno local sobre el
     * mismo barrio). Cerrar o reprogramar el corte que se está tocando no debe pisar el estado del
     * sector si otro corte distinto sigue abierto sobre él: cerrar el corte local mientras el
     * masivo seguía abierto dejaba el sector en `CON_SERVICIO` aunque en la realidad seguía sin
     * agua — el falso positivo que `ADR-014` prohíbe. Se calcula el estado más severo entre el que
     * se iba a aplicar y el de cada otro corte todavía abierto sobre el mismo sector.
     */
    private EstadoServicio sinDegradarPorOtrosCortesAbiertos(SectorId sectorId, CorteAgua corteActual,
                                                               EstadoServicio nuevoEstado) {
        EstadoServicio masSevero = nuevoEstado;
        for (CorteAgua otro : cortes.listarPorSector(sectorId)) {
            if (otro.equals(corteActual) || otro.ventana().estaCerrada()) {
                continue;
            }
            EstadoServicio estadoOtro = otro.ventana().inicio().isAfter(reloj.ahora())
                    ? EstadoServicio.CORTE_PROGRAMADO
                    : EstadoServicio.SIN_SERVICIO;
            masSevero = masSevero(masSevero, estadoOtro);
        }
        return masSevero;
    }

    private static EstadoServicio masSevero(EstadoServicio a, EstadoServicio b) {
        return severidad(a) >= severidad(b) ? a : b;
    }

    private static int severidad(EstadoServicio estado) {
        return switch (estado) {
            case SIN_SERVICIO -> 2;
            case CORTE_PROGRAMADO -> 1;
            default -> 0;
        };
    }
}
