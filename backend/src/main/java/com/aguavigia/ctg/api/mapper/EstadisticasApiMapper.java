package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.EstadisticasRespuesta;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticaSector;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EstadisticasApiMapper {

    EstadisticasRespuesta aRespuesta(EstadisticasGlobales estadisticas);

    @Mapping(target = "sectorId", source = "sectorId.valor")
    EstadisticasRespuesta.EstadisticaSectorRespuesta aRespuesta(EstadisticaSector sector);
}
