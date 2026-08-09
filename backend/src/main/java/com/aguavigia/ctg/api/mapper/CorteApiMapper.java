package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.CorteRespuesta;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.SectorId;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CorteApiMapper {

    /**
     * Todo por `expression`, no por `source`: `CorteAgua` no es un record (usa `Builder`), así
     * que MapStruct no reconoce `id()`, `ventana()`, etc. como propiedades de bean.
     */
    @Mapping(target = "id", expression = "java(corte.id().valor())")
    @Mapping(target = "sectoresAfectados", expression = "java(idsComoTexto(corte.sectoresAfectados()))")
    @Mapping(target = "inicio", expression = "java(corte.ventana().inicio())")
    @Mapping(target = "finPrometido", expression = "java(corte.ventana().finPrometido())")
    @Mapping(target = "finReal", expression = "java(corte.ventana().finReal())")
    @Mapping(target = "causa", expression = "java(corte.causa())")
    @Mapping(target = "origen", expression = "java(corte.origen().name())")
    @Mapping(target = "estado", expression = "java(corte.estado().name())")
    CorteRespuesta aRespuesta(CorteAgua corte);

    List<CorteRespuesta> aRespuestas(List<CorteAgua> cortes);

    default List<String> idsComoTexto(List<SectorId> sectoresAfectados) {
        return sectoresAfectados.stream().map(SectorId::valor).toList();
    }
}
