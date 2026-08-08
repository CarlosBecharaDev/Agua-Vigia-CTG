package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * `generadoEn` no es decorativo: DESIGN.md §6 exige frescura siempre visible, y sin la hora
 * del servidor el cliente no puede distinguir "todo tranquilo" de "esto lleva horas mudo".
 */
@Schema(description = "Listado de sectores con la hora en que el servidor genero la respuesta")
public record RespuestaSectores(

        List<SectorRespuesta> sectores,

        @Schema(description = "Instante en que el servidor genero esta respuesta (UTC)")
        Instant generadoEn) {
}
