package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificarSuscripcionesService {

    private final SuscripcionRepository suscripciones;
    private final NotificacionPort notificacionPort;

    public NotificarSuscripcionesService(SuscripcionRepository suscripciones, NotificacionPort notificacionPort) {
        this.suscripciones = suscripciones;
        this.notificacionPort = notificacionPort;
    }

    @Async
    @EventListener
    public void alActualizarSector(SectorActualizadoEvent event) {
        List<Suscripcion> confirmadas = suscripciones.buscarConfirmadasPorSector(event.sector().id());
        for (Suscripcion sub : confirmadas) {
            notificacionPort.avisarCambioDeEstado(sub, event.sector());
        }
    }
}
