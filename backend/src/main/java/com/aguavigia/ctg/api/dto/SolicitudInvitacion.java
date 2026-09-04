package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Invitacion emitida por un ADMIN: crea la cuenta con su rol y manda el enlace")
public record SolicitudInvitacion(

        @NotBlank @Email
        String correo,

        @NotBlank @Size(min = 2, max = 80)
        String nombre,

        @NotNull
        @Schema(description = "ADMIN, VEEDOR u OBSERVADOR")
        String rol) {

    /** Delega en SolicitudPermisos para que un rol mal escrito de el mismo error en los dos sitios. */
    public com.aguavigia.ctg.domain.RolVeedor rolDominio() {
        return SolicitudPermisos.aRol(rol);
    }
}
