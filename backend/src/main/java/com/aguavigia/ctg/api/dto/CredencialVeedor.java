package com.aguavigia.ctg.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credencial de acceso al panel del veedor")
public record CredencialVeedor(

        @NotBlank
        @Email
        @Schema(description = "Correo de la cuenta", example = "veedor@ejemplo.org")
        String correo,

        @NotBlank
        @Schema(description = "Clave de la cuenta")
        String clave,

        @Schema(description = """
                Codigo de 6 digitos de la app de autenticacion. Se omite en el primer intento; si la
                cuenta tiene segundo factor, la respuesta 401 con type `segundo-factor-requerido`
                indica que hay que reintentar incluyendolo.""")
        String codigoTotp) {
}
