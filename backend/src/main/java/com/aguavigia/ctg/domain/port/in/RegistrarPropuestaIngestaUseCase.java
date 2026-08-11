package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;

import java.util.Optional;

/** M9 — lo que el pipeline de ingesta llama en vez de escribir el estado del sector. */
public interface RegistrarPropuestaIngestaUseCase {

    /**
     * Vacío cuando la propuesta no se registra: o el sector no existe, o ya hay una pendiente
     * idéntica esperando revisión. Ninguno de los dos casos es un error del pipeline — no debe
     * cortar el ciclo por eso.
     */
    Optional<PropuestaIngesta> registrar(SectorId sectorId, EstadoServicio estadoPropuesto,
                                          String fuente, String urlOriginal, String citaTextual,
                                          double confianza);
}
