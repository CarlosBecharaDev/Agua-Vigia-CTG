package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;

/** M9 — el veedor decide si una propuesta de la ingesta llega o no al mapa público (RF018, M5). */
public interface RevisarPropuestaIngestaUseCase {

    /** Aplica el estado propuesto al sector y anexa el evento a la bitácora (RF026). */
    PropuestaIngesta aprobar(PropuestaId id);

    /** No toca el sector: la propuesta queda archivada como descartada, no se borra. */
    PropuestaIngesta descartar(PropuestaId id);
}
