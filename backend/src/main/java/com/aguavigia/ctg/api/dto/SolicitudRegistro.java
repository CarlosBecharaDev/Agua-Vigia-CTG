package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud de acceso al panel. No concede nada: exige verificar el correo y que un ADMIN apruebe.")
public record SolicitudRegistro(

        @NotBlank @Email
        String correo,

        @NotBlank
        @Size(min = 2, max = 80)
        @Schema(description = "Nombre con el que apareceras en la auditoria del panel")
        String nombre,

        @NotBlank
        @Schema(description = "Minimo 12 caracteres. La politica completa vive en ClaveEnClaro.")
        String clave) {
}
