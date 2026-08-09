package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Component;

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
}
