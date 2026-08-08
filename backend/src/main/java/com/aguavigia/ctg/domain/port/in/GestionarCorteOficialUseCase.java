package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;

import java.time.Instant;

/** RF016-RF017 — registrar un corte oficial y cerrarlo con la hora real de restablecimiento. */
public interface GestionarCorteOficialUseCase {

    CorteAgua registrar(CorteAgua corte);

    CorteAgua cerrar(CorteId corteId, Instant horaReal);
}
