package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Reporte ciudadano sin registro (RF005-RF008)")
public record SolicitudReporte(

        @NotBlank
        @Schema(description = "Identificador del sector reportado", example = "bocagrande")
        String sectorId,

        @NotBlank
        @Schema(description = "SIN_AGUA, PRESION_BAJA o SERVICIO_RESTABLECIDO", example = "SIN_AGUA")
        String tipo,

        @NotBlank
        @Schema(description = """
                Huella anónima del dispositivo (ADR-007) — no es una cuenta ni un identificador
                personal. El cliente la genera una vez (p. ej. un UUID persistido en el dispositivo,
                hasheado) y la reutiliza en cada reporte; es lo único que permite RF006 (límite de
                reportes por dispositivo) sin pedir registro.""")
        String huella,

        @Valid
        @Schema(description = "Opcional — solo si el usuario autorizó compartir su ubicación (RF007)")
        CoordenadaDTO coordenada) {
}
