package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class SuscripcionMongoAdapter implements SuscripcionRepository {

    private final SuscripcionMongoRepository repositorio;

    public SuscripcionMongoAdapter(SuscripcionMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public Suscripcion guardar(Suscripcion suscripcion) {
        SuscripcionDocumento documento = new SuscripcionDocumento();
        documento.setId(suscripcion.id().valor());
        documento.setCorreo(suscripcion.correo().valor());
        documento.setSectorIds(suscripcion.sectorIds().stream().map(SectorId::valor).toList());
        documento.setEstado(suscripcion.estado().name());
        documento.setTokenConfirmacion(suscripcion.tokenConfirmacion());
        documento.setCreadaEn(suscripcion.creadaEn());

        repositorio.save(documento);
        return suscripcion;
    }

    @Override
    public Optional<Suscripcion> buscarPorToken(String token) {
        return repositorio.findByTokenConfirmacion(token).map(SuscripcionMongoAdapter::aDominio);
    }

    @Override
    public List<Suscripcion> buscarConfirmadasPorSector(SectorId sectorId) {
        return repositorio.findBySectorIdsContainingAndEstado(sectorId.valor(), EstadoSuscripcion.CONFIRMADA.name())
                .stream()
                .map(SuscripcionMongoAdapter::aDominio)
                .toList();
    }

    private static Suscripcion aDominio(SuscripcionDocumento documento) {
        return new Suscripcion(
                new SuscripcionId(documento.getId()),
                new CorreoElectronico(documento.getCorreo()),
                documento.getSectorIds().stream().map(SectorId::new).toList(),
                EstadoSuscripcion.valueOf(documento.getEstado()),
                documento.getTokenConfirmacion(),
                documento.getCreadaEn());
    }
}
