package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;

import java.util.List;

/** RF012-RF013 — suscribirse a uno o más sectores con solo un correo; queda pendiente de confirmación. */
public interface SuscribirseUseCase {

    Suscripcion suscribir(CorreoElectronico correo, List<SectorId> sectorIds);
}
