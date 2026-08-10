package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.SectorId;

public interface EnviarAlertaPushUseCase {
    void enviar(SectorId sectorId, String mensaje);
}
