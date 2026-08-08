package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

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

    public SectorMongoAdapter(SectorMongoRepository repositorio, RelojPort reloj) {
        this.repositorio = repositorio;
        this.reloj = reloj;
    }

    @Override
    public Optional<Sector> buscarPorId(SectorId id) {
        return repositorio.findBySlug(id.valor()).map(SectorMongoAdapter::aDominio);
    }

    @Override
    public List<Sector> listarTodos() {
        return repositorio.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
                .map(SectorMongoAdapter::aDominio)
                .toList();
    }

    @Override
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

        return aDominio(repositorio.save(documento));
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
