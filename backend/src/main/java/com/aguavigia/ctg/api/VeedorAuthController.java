package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.CredencialVeedor;
import com.aguavigia.ctg.api.dto.SesionVeedor;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * RF019 — login del panel del veedor. Una sola credencial compartida, no cuentas individuales
 * (ADR-016): no hay entidad Usuario en el dominio, y crearla es decision de D2, no de D3 solo.
 */
@Tag(name = "Veedor", description = "Autenticacion del panel del veedor")
@RestController
@RequestMapping("/api/veedor")
public class VeedorAuthController {

    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final String hashConfigurado;

    public VeedorAuthController(PasswordEncoder passwordEncoder,
                                 JwtProvider jwtProvider,
                                 @Value("${aguavigia.veedor.password-hash:}") String hashConfigurado) {
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.hashConfigurado = hashConfigurado;
    }

    @Operation(summary = "Iniciar sesion como veedor",
            description = "Devuelve un token JWT valido por 8 horas (RNF011) si la clave es correcta.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Credencial correcta, token emitido"),
            @ApiResponse(responseCode = "401", description = "Credencial incorrecta"),
            @ApiResponse(responseCode = "503", description = "El servidor no tiene configurada la credencial del veedor")
    })
    @PostMapping("/sesion")
    public ResponseEntity<?> iniciarSesion(@Valid @RequestBody CredencialVeedor credencial) {
        if (hashConfigurado.isBlank()) {
            return ResponseEntity.status(503)
                    .body(Map.of("detail", "El servidor no tiene configurada VEEDOR_PASSWORD_HASH."));
        }
        if (!passwordEncoder.matches(credencial.clave(), hashConfigurado)) {
            return ResponseEntity.status(401).build();
        }

        try {
            return ResponseEntity.ok(new SesionVeedor(jwtProvider.emitirParaVeedor()));
        } catch (IllegalStateException jwtSecretNoConfigurado) {
            return ResponseEntity.status(503)
                    .body(Map.of("detail", "El servidor no tiene configurado JWT_SECRET."));
        }
    }
}
