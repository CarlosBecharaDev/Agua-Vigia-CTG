package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;

import java.util.List;
import java.util.Optional;

public interface PropuestaIngestaRepository {

    PropuestaIngesta guardar(PropuestaIngesta propuesta);

    Optional<PropuestaIngesta> buscarPorId(PropuestaId id);

    /** La cola de revisión del veedor, más recientes primero. */
    List<PropuestaIngesta> listarPendientes();

    /**
     * Los cuatro feeds configurados (Google News, Zona Cero, Caracol, W Radio) cubren las mismas
     * noticias, y cada versión tiene su propio hash — así que `DeduplicadorReciente` no las une.
     * Sin este chequeo, un solo corte le deja al veedor cuatro propuestas idénticas que revisar.
     */
    boolean existePendiente(SectorId sectorId, EstadoServicio estadoPropuesto);
}
