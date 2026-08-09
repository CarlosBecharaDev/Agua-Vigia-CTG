package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.ReporteRespuesta;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReporteApiMapper {

    @Mapping(target = "id", source = "id.valor")
    @Mapping(target = "sectorId", source = "sectorId.valor")
    ReporteRespuesta aRespuesta(ReporteCiudadano reporte);
}
