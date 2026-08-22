package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.IndiceCumplimientoRespuesta;
import com.aguavigia.ctg.api.dto.PuntoSerieRespuesta;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.PuntoSerieCumplimiento;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CumplimientoApiMapper {

    @Mapping(target = "sectorId", expression = "java(indice.sectorId() != null ? indice.sectorId().valor() : null)")
    @Mapping(target = "duracionPrometidaSegundos", expression = "java(indice.duracionPrometida().toSeconds())")
    @Mapping(target = "duracionRealSegundos", expression = "java(indice.duracionReal().toSeconds())")
    @Mapping(target = "desviacionSegundos", expression = "java(indice.desviacion().toSeconds())")
    IndiceCumplimientoRespuesta aRespuesta(IndiceCumplimiento indice);

    /** RF024 — `periodo` sale como "2026-08": YearMonth.toString() ya es ISO 8601. */
    @Mapping(target = "periodo", expression = "java(punto.periodo().toString())")
    @Mapping(target = "duracionPrometidaSegundos", expression = "java(punto.indice().duracionPrometida().toSeconds())")
    @Mapping(target = "duracionRealSegundos", expression = "java(punto.indice().duracionReal().toSeconds())")
    @Mapping(target = "desviacionSegundos", expression = "java(punto.indice().desviacion().toSeconds())")
    @Mapping(target = "porcentajeCumplimiento", expression = "java(punto.indice().porcentajeCumplimiento())")
    PuntoSerieRespuesta aRespuesta(PuntoSerieCumplimiento punto);

    List<PuntoSerieRespuesta> aRespuestas(List<PuntoSerieCumplimiento> puntos);
}
