package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.PropuestaIngestaRespuesta;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PropuestaIngestaApiMapper {

    @Mapping(target = "id", source = "id.valor")
    @Mapping(target = "sectorId", source = "sectorId.valor")
    @Mapping(target = "estadoPropuesto", expression = "java(propuesta.estadoPropuesto().name())")
    @Mapping(target = "estadoRevision", expression = "java(propuesta.estadoRevision().name())")
    PropuestaIngestaRespuesta aRespuesta(PropuestaIngesta propuesta);

    List<PropuestaIngestaRespuesta> aRespuestas(List<PropuestaIngesta> propuestas);
}
