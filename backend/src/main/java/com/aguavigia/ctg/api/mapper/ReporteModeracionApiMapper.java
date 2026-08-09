package com.aguavigia.ctg.api.mapper;

import com.aguavigia.ctg.api.dto.CoordenadaDTO;
import com.aguavigia.ctg.api.dto.ReporteModeracionRespuesta;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import org.mapstruct.Mapping;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ReporteModeracionApiMapper {

    @Mapping(target = "id", source = "id.valor")
    @Mapping(target = "sectorId", source = "sectorId.valor")
    ReporteModeracionRespuesta aRespuesta(ReporteCiudadano reporte);

    List<ReporteModeracionRespuesta> aRespuestas(List<ReporteCiudadano> reportes);

    default CoordenadaDTO map(Coordenada coordenada) {
        return coordenada == null ? null : new CoordenadaDTO(coordenada.latitud(), coordenada.longitud());
    }
}
