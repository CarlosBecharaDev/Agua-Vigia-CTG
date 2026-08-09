package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.IndiceCumplimientoRespuesta;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CumplimientoApiMapper {

    @Mapping(target = "sectorId", expression = "java(indice.sectorId() != null ? indice.sectorId().valor() : null)")
    @Mapping(target = "duracionPrometidaSegundos", expression = "java(indice.duracionPrometida().toSeconds())")
    @Mapping(target = "duracionRealSegundos", expression = "java(indice.duracionReal().toSeconds())")
    @Mapping(target = "desviacionSegundos", expression = "java(indice.desviacion().toSeconds())")
    IndiceCumplimientoRespuesta aRespuesta(IndiceCumplimiento indice);
}
