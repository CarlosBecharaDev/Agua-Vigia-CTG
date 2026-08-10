package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.EnviarAlertaPushUseCase;
import com.aguavigia.ctg.domain.port.out.NotificadorPushPort;
import org.springframework.stereotype.Service;

@Service
public class EnviarAlertaPushService implements EnviarAlertaPushUseCase {

    private final NotificadorPushPort notificadorPushPort;

    public EnviarAlertaPushService(NotificadorPushPort notificadorPushPort) {
        this.notificadorPushPort = notificadorPushPort;
    }

    @Override
    public void enviar(SectorId sectorId, String mensaje) {
        notificadorPushPort.enviarAlerta(sectorId, mensaje);
    }
}
