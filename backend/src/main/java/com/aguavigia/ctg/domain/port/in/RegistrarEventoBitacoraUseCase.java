package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.EventoBitacora;

/** RF026 — cada evento relevante queda en la bitácora de solo anexado. */
public interface RegistrarEventoBitacoraUseCase {

    void registrar(EventoBitacora evento);
}
