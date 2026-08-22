package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import com.aguavigia.ctg.application.SectorActualizadoEvent;
import java.util.ArrayList;

import java.util.List;
import java.util.Optional;

/**
 * Adaptador de SectorRepository sobre MongoDB.
 *
 * Un sector sin estado registrado se traduce a estadoActual == null, no a CON_SERVICIO
 * (ver ADR-014): afirmar que hay servicio sin haberlo verificado es exactamente el falso
 * positivo que MEMORY.md manda evitar.
 */
@Component
public class SectorMongoAdapter implements SectorRepository {

    private final SectorMongoRepository repositorio;
    private final RelojPort reloj;
    private final ApplicationEventPublisher eventPublisher;

    public SectorMongoAdapter(SectorMongoRepository repositorio, RelojPort reloj, ApplicationEventPublisher eventPublisher) {
        this.repositorio = repositorio;
        this.reloj = reloj;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public Optional<Sector> buscarPorId(SectorId id) {
        return repositorio.findBySlug(id.valor()).map(SectorMongoAdapter::aDominio);
    }

    /**
     * Se cachea la lista completa, no cada sector por separado: el mapa pide siempre los 213 de
     * golpe y una sola llave se invalida entera cuando el consenso mueve un estado.
     *
     * ArrayList y no el List inmutable de toList(): el serializador del cache escribe la clase
     * concreta del valor, y ImmutableCollections$ListN no se puede reconstruir al leerla de vuelta.
     */
    @Override
    @Cacheable("sectores")
    public List<Sector> listarTodos() {
        return new ArrayList<>(repositorio.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
                .map(SectorMongoAdapter::aDominio)
                .toList());
    }

    /**
     * Invalida el cache aunque el estado no haya cambiado. Sin esto, un corte confirmado por
     * consenso tardaria hasta un TTL entero en verse en el mapa, que es justo la desinformacion
     * que el proyecto existe para evitar (DESIGN.md §6).
     */
    @Override
    @CacheEvict(value = "sectores", allEntries = true)
    public Sector guardar(Sector sector) {
        // Se lee el documento existente en vez de construir uno nuevo: la geometria y los datos
        // censales los sembro D5 y este adaptador no los produce. Un save() sobre un documento
        // recien construido los borraria de los 213 barrios.
        SectorDocumento documento = repositorio.findBySlug(sector.id().valor())
                .orElseGet(() -> {
                    SectorDocumento nuevo = new SectorDocumento();
                    nuevo.setSlug(sector.id().valor());
                    return nuevo;
                });

        documento.setNombre(sector.nombre());
        documento.setPoblacion(sector.poblacion());

        boolean cambioElEstado = sector.estadoActual() != null
                && !sector.estadoActual().name().equals(documento.getEstadoActual());
        if (cambioElEstado) {
            documento.setEstadoActual(sector.estadoActual().name());
            documento.setEstadoActualizadoEn(reloj.ahora());
        }

        Sector guardado = aDominio(repositorio.save(documento));
        if (cambioElEstado) {
            eventPublisher.publishEvent(new SectorActualizadoEvent(guardado));
        }
        return guardado;
    }

    private static Sector aDominio(SectorDocumento documento) {
        return new Sector(
                new SectorId(documento.getSlug()),
                documento.getNombre(),
                documento.getPoblacion(),
                aEstadoServicio(documento.getEstadoActual()));
    }

    /**
     * Devuelve null —no un valor por defecto— cuando el sector no tiene estado o cuando el
     * guardado en base de datos ya no corresponde a ningun valor del enum. Un estado desconocido
     * se trata como ausencia de dato, no como servicio normal.
     */
    private static EstadoServicio aEstadoServicio(String valorGuardado) {
        if (valorGuardado == null || valorGuardado.isBlank()) {
            return null;
        }
        try {
            return EstadoServicio.valueOf(valorGuardado);
        } catch (IllegalArgumentException valorFueraDelEnum) {
            return null;
        }
    }
}
