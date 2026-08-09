package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Adaptador de CorteAguaRepository sobre MongoDB (RF016-RF017).
 *
 * A diferencia de SectorMongoAdapter, aqui no hay que preservar campos ajenos al leer antes de
 * guardar: CorteAgua es dueño exclusivo de su documento, nadie mas lo siembra ni lo enriquece.
 */
@Component
public class CorteAguaMongoAdapter implements CorteAguaRepository {

    private final CorteAguaMongoRepository repositorio;

    public CorteAguaMongoAdapter(CorteAguaMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public Optional<CorteAgua> buscarPorId(CorteId id) {
        return repositorio.findById(id.valor()).map(CorteAguaMongoAdapter::aDominio);
    }

    @Override
    public List<CorteAgua> listarPorSector(SectorId sectorId) {
        return repositorio.findBySectoresAfectadosContaining(sectorId.valor()).stream()
                .map(CorteAguaMongoAdapter::aDominio)
                .toList();
    }

    @Override
    public CorteAgua guardar(CorteAgua corte) {
        CorteAguaDocumento documento = new CorteAguaDocumento();
        documento.setId(corte.id().valor());
        documento.setSectoresAfectados(corte.sectoresAfectados().stream().map(SectorId::valor).toList());
        documento.setInicio(corte.ventana().inicio());
        documento.setFinPrometido(corte.ventana().finPrometido());
        documento.setFinReal(corte.ventana().finReal());
        documento.setCausa(corte.causa());
        documento.setOrigen(corte.origen().name());
        documento.setEstado(corte.estado().name());

        repositorio.save(documento);
        return corte;
    }

    private static CorteAgua aDominio(CorteAguaDocumento documento) {
        return CorteAgua.builder()
                .id(new CorteId(documento.getId()))
                .sectoresAfectados(documento.getSectoresAfectados().stream().map(SectorId::new).toList())
                .inicio(documento.getInicio())
                .finPrometido(documento.getFinPrometido())
                .finReal(documento.getFinReal())
                .causa(documento.getCausa())
                .origen(OrigenCorte.valueOf(documento.getOrigen()))
                .estado(EstadoCorte.valueOf(documento.getEstado()))
                .build();
    }
}
