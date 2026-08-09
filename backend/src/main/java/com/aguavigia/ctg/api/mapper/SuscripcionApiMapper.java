package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.SuscripcionRespuesta;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SuscripcionApiMapper {

    @Mapping(target = "id", source = "id.valor")
    @Mapping(target = "correo", source = "correo.valor")
    SuscripcionRespuesta aRespuesta(Suscripcion suscripcion);

    default String map(SectorId sectorId) {
        return sectorId.valor();
    }

    default String map(CorreoElectronico correo) {
        return correo.valor();
    }
}
