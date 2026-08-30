package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
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
 * M9 — recibe lo que detecta el pipeline y decide si va a la cola del veedor o al mapa.
 *
 * Lo que viene de Acuacar se publica en el acto; lo que viene de prensa espera revisión
 * ({@link PropuestaIngesta#esDeFuenteOficial}). Publicar reusa {@link RevisarPropuestaIngestaUseCase}
 * en vez de tocar el sector aquí: así el camino automático y el del veedor son el mismo código —
 * misma guarda de estado repetido, mismo evento de bitácora, mismos correos y SSE— y no pueden
 * divergir con el tiempo.
 */
@Service
public class RegistrarPropuestaIngestaService implements RegistrarPropuestaIngestaUseCase {

    private static final Logger log = LoggerFactory.getLogger(RegistrarPropuestaIngestaService.class);

    private final PropuestaIngestaRepository propuestas;
    private final SectorRepository sectores;
    private final RevisarPropuestaIngestaUseCase revisar;
    private final RelojPort reloj;

    public RegistrarPropuestaIngestaService(PropuestaIngestaRepository propuestas,
                                             SectorRepository sectores,
                                             RevisarPropuestaIngestaUseCase revisar,
                                             RelojPort reloj) {
        this.propuestas = propuestas;
        this.sectores = sectores;
        this.revisar = revisar;
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

        PropuestaIngesta guardada = propuestas.guardar(propuesta);

        if (guardada.esDeFuenteOficial()) {
            log.info("Propuesta oficial publicada sin revisión: {} en '{}' (fuente: {})",
                    estadoPropuesto, sectorId.valor(), fuente);
            return Optional.of(revisar.aprobar(guardada.id()));
        }

        log.info("Propuesta de ingesta encolada para revisión: {} en '{}' (fuente: {})",
                estadoPropuesto, sectorId.valor(), fuente);
        return Optional.of(guardada);
    }
}
