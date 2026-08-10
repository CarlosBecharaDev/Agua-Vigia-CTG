package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.port.in.EnviarAlertaPushUseCase;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AlertaPushSectorListener {

    private final EnviarAlertaPushUseCase enviarAlertaPushUseCase;

    public AlertaPushSectorListener(EnviarAlertaPushUseCase enviarAlertaPushUseCase) {
        this.enviarAlertaPushUseCase = enviarAlertaPushUseCase;
    }

    @Async
    @EventListener
    public void onSectorActualizado(SectorActualizadoEvent event) {
        String mensaje = String.format("Alerta: El sector %s ha cambiado su estado a: %s", 
                event.sector().nombre(), 
                event.sector().estadoActual().name());
        
        enviarAlertaPushUseCase.enviar(event.sector().id(), mensaje);
    }
}
