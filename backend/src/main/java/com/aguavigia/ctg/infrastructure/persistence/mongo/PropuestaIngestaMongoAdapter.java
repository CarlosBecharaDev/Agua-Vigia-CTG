package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class PropuestaIngestaMongoAdapter implements PropuestaIngestaRepository {

    private final PropuestaIngestaMongoRepository repositorio;

    public PropuestaIngestaMongoAdapter(PropuestaIngestaMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public PropuestaIngesta guardar(PropuestaIngesta propuesta) {
        PropuestaIngestaDocumento documento = new PropuestaIngestaDocumento();
        documento.setId(propuesta.id().valor());
        documento.setSectorId(propuesta.sectorId().valor());
        documento.setEstadoPropuesto(propuesta.estadoPropuesto().name());
        documento.setFuente(propuesta.fuente());
        documento.setUrlOriginal(propuesta.urlOriginal());
        documento.setCitaTextual(propuesta.citaTextual());
        documento.setConfianza(propuesta.confianza());
        documento.setDetectadaEn(propuesta.detectadaEn());
        documento.setEstadoRevision(propuesta.estadoRevision().name());

        repositorio.save(documento);
        return propuesta;
    }

    @Override
    public Optional<PropuestaIngesta> buscarPorId(PropuestaId id) {
        return repositorio.findById(id.valor()).map(PropuestaIngestaMongoAdapter::aDominio);
    }

    @Override
    public Pagina<PropuestaIngesta> listarPendientes(int pagina, int tamano) {
        Page<PropuestaIngestaDocumento> resultado = repositorio.findByEstadoRevision(
                EstadoRevision.PENDIENTE.name(),
                PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.DESC, "detectadaEn")));

        return new Pagina<>(
                resultado.getContent().stream().map(PropuestaIngestaMongoAdapter::aDominio).toList(),
                pagina,
                tamano,
                resultado.getTotalElements());
    }

    @Override
    public boolean existePendiente(SectorId sectorId, EstadoServicio estadoPropuesto) {
        return repositorio.existsBySectorIdAndEstadoPropuestoAndEstadoRevision(
                sectorId.valor(), estadoPropuesto.name(), EstadoRevision.PENDIENTE.name());
    }

    private static PropuestaIngesta aDominio(PropuestaIngestaDocumento documento) {
        return new PropuestaIngesta(
                new PropuestaId(documento.getId()),
                new SectorId(documento.getSectorId()),
                EstadoServicio.valueOf(documento.getEstadoPropuesto()),
                documento.getFuente(),
                documento.getUrlOriginal(),
                documento.getCitaTextual(),
                documento.getConfianza(),
                documento.getDetectadaEn(),
                EstadoRevision.valueOf(documento.getEstadoRevision()));
    }
}
