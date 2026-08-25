package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * M9 — deja la propuesta en la cola del veedor. No toca el estado del sector: eso solo pasa en
 * {@link RevisarPropuestaIngestaService#aprobar}.
 */
@Service
public class RegistrarPropuestaIngestaService implements RegistrarPropuestaIngestaUseCase {

    private static final Logger log = LoggerFactory.getLogger(RegistrarPropuestaIngestaService.class);

    private final PropuestaIngestaRepository propuestas;
    private final SectorRepository sectores;
    private final RelojPort reloj;

    public RegistrarPropuestaIngestaService(PropuestaIngestaRepository propuestas,
                                             SectorRepository sectores,
                                             RelojPort reloj) {
        this.propuestas = propuestas;
        this.sectores = sectores;
        this.reloj = reloj;
    }

    @Override
    public Optional<PropuestaIngesta> registrar(SectorId sectorId, EstadoServicio estadoPropuesto,
                                                 String fuente, String urlOriginal, String citaTextual,
                                                 double confianza, Instant inicioDeclarado,
                                                 Instant finPrometido) {
        // Un nombre extraido de una nota de prensa no tiene por que ser un barrio de Cartagena.
        // Se descarta en silencio (log a nivel debug) porque es el caso normal, no una anomalia.
        if (sectores.buscarPorId(sectorId).isEmpty()) {
            log.debug("Propuesta ignorada: el sector '{}' no existe", sectorId.valor());
            return Optional.empty();
        }

        if (propuestas.existePendiente(sectorId, estadoPropuesto)) {
            log.debug("Propuesta ignorada: ya hay una pendiente de {} para '{}'",
                    estadoPropuesto, sectorId.valor());
            return Optional.empty();
        }

        PropuestaIngesta propuesta = new PropuestaIngesta(
                new PropuestaId(UUID.randomUUID().toString()),
                sectorId,
                estadoPropuesto,
                fuente,
                urlOriginal,
                citaTextual,
                confianza,
                reloj.ahora(),
                inicioDeclarado,
                finPrometido);

        log.info("Propuesta de ingesta registrada: {} en '{}' (fuente: {})",
                estadoPropuesto, sectorId.valor(), fuente);
        return Optional.of(propuestas.guardar(propuesta));
    }
}
