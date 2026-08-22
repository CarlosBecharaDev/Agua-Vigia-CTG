package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PropuestaIngestaRepository {

    PropuestaIngesta guardar(PropuestaIngesta propuesta);

    Optional<PropuestaIngesta> buscarPorId(PropuestaId id);

    /** La cola de revisión del veedor, más recientes primero y paginada. */
    Pagina<PropuestaIngesta> listarPendientes(int pagina, int tamano);

    /**
     * Los cuatro feeds configurados (Google News, Zona Cero, Caracol, W Radio) cubren las mismas
     * noticias, y cada versión tiene su propio hash — así que `DeduplicadorReciente` no las une.
     * Sin este chequeo, un solo corte le deja al veedor cuatro propuestas idénticas que revisar.
     */
    boolean existePendiente(SectorId sectorId, EstadoServicio estadoPropuesto);

    /**
     * Propuestas ya aprobadas cuya ventana declarada todavía puede mover el estado de un sector:
     * las que aún no terminan, más las que acaban de terminar y falta devolver el barrio a
     * CON_SERVICIO. Acotar por {@code finDesde} evita recorrer el histórico entero en cada barrido.
     */
    List<PropuestaIngesta> listarAprobadasConVentanaVigente(Instant finDesde);
}
