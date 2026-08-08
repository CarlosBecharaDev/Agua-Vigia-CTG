package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.SectorRespuesta;
import com.aguavigia.ctg.domain.Sector;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Dominio -> DTO. Nunca al reves: no hay ningun punto de la API que construya un Sector desde
 * la red en el Sprint 1.
 */
@Mapper(componentModel = "spring")
public interface SectorApiMapper {

    /**
     * `actualizadoEn` queda nulo en el Sprint 1: ningun sector tiene estado registrado todavia,
     * y sin estado no hay fecha de estado. Deja de ser nulo cuando el consenso (M3, Sprint 2)
     * empiece a escribir estados — el campo ya viaja en el documento de Mongo.
     */
    @Mapping(target = "id", source = "id.valor")
    @Mapping(target = "estado", source = "estadoActual")
    @Mapping(target = "actualizadoEn", ignore = true)
    SectorRespuesta aRespuesta(Sector sector);

    List<SectorRespuesta> aRespuestas(List<Sector> sectores);
}
