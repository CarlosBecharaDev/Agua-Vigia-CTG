package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.SectorId;

public interface NotificadorPushPort {
    void enviarAlerta(SectorId sectorId, String mensaje);
}
