package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.in.SuscribirseUseCase;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Un correo con un sector que no existe se rechaza entero (400, vía IllegalArgumentException):
 * partir la suscripción entre "válidos" e "inválidos" en silencio dejaría al vecino sin saber
 * que uno de sus barrios nunca quedó suscrito.
 */
@Service
public class SuscribirseService implements SuscribirseUseCase {

    private final SectorRepository sectores;
    private final SuscripcionRepository suscripciones;
    private final NotificacionPort notificaciones;
    private final RelojPort reloj;

    public SuscribirseService(SectorRepository sectores,
                               SuscripcionRepository suscripciones,
                               NotificacionPort notificaciones,
                               RelojPort reloj) {
        this.sectores = sectores;
        this.suscripciones = suscripciones;
        this.notificaciones = notificaciones;
        this.reloj = reloj;
    }

    @Override
    public Suscripcion suscribir(CorreoElectronico correo, List<SectorId> sectorIds) {
        List<Sector> sectoresSuscritos = sectorIds.stream()
                .map(id -> sectores.buscarPorId(id)
                        .orElseThrow(() -> new IllegalArgumentException("No existe el sector '" + id.valor() + "'")))
                .toList();

        Suscripcion suscripcion = new Suscripcion(
                new SuscripcionId(UUID.randomUUID().toString()),
                correo,
                sectorIds,
                EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                UUID.randomUUID().toString(),
                reloj.ahora());

        Suscripcion guardada = suscripciones.guardar(suscripcion);
        notificaciones.enviarConfirmacionSuscripcion(guardada, sectoresSuscritos);
        return guardada;
    }
}
