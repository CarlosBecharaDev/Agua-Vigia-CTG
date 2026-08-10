package com.aguavigia.ctg.infrastructure.push;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.NotificadorPushPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class NotificadorPushWebhookAdapter implements NotificadorPushPort {

    private static final Logger log = LoggerFactory.getLogger(NotificadorPushWebhookAdapter.class);

    @Override
    public void enviarAlerta(SectorId sectorId, String mensaje) {
        log.info("Simulando envío de alerta push (WhatsApp/Telegram) al sector [{}] con mensaje: {}", sectorId.valor(), mensaje);
    }
}
