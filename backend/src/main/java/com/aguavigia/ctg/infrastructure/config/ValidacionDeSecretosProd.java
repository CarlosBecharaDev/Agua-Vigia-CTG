package com.aguavigia.ctg.infrastructure.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Aborta el arranque en producción si falta un secreto sin el cual la plataforma queda a medias.
 *
 * En `dev` los secretos vacíos son deliberados y están documentados: `JwtProvider` y
 * `VeedorAuthController` validan al usarse y no al arrancar, para que el resto del backend levante
 * sin ellos. El problema es que ese mismo diseño, en producción, deja arrancar un despliegue que se
 * ve sano y donde el panel del veedor responde 503 en silencio — nadie se entera hasta que alguien
 * intenta moderar un reporte.
 *
 * Se valida en `@PostConstruct` y no en `ApplicationReadyEvent`: aquí falla el arranque del
 * contexto y el proceso no llega a atender peticiones. Con el evento, el servidor ya estaría
 * escuchando cuando se detecta el problema.
 *
 * Mismo criterio que `application-prod.yml`, que declara `MONGODB_URI` y compañía sin valor por
 * defecto para fallar ruidosamente en vez de conectarse en silencio a localhost.
 */
@Component
@Profile("prod")
public class ValidacionDeSecretosProd {

    private static final Logger log = LoggerFactory.getLogger(ValidacionDeSecretosProd.class);

    /** HS256 lo exige; es la misma cota que aplica JwtProvider. */
    private static final int BYTES_MINIMOS_DEL_SECRETO_JWT = 32;

    private final String secretoJwt;
    private final String hashDelVeedor;
    private final String claveIot;

    public ValidacionDeSecretosProd(@Value("${aguavigia.jwt.secret:}") String secretoJwt,
                                     @Value("${aguavigia.veedor.password-hash:}") String hashDelVeedor,
                                     @Value("${aguavigia.iot.key:}") String claveIot) {
        this.secretoJwt = secretoJwt;
        this.hashDelVeedor = hashDelVeedor;
        this.claveIot = claveIot;
    }

    @PostConstruct
    void validar() {
        List<String> faltantes = new ArrayList<>();

        if (secretoJwt == null || secretoJwt.isBlank()) {
            faltantes.add("JWT_SECRET no está configurado. Genéralo con: openssl rand -base64 32");
        } else if (secretoJwt.getBytes(StandardCharsets.UTF_8).length < BYTES_MINIMOS_DEL_SECRETO_JWT) {
            faltantes.add("JWT_SECRET mide menos de %d bytes y HS256 los exige. Genéralo con: openssl rand -base64 32"
                    .formatted(BYTES_MINIMOS_DEL_SECRETO_JWT));
        }

        if (hashDelVeedor == null || hashDelVeedor.isBlank()) {
            faltantes.add("VEEDOR_PASSWORD_HASH no está configurado: el panel del veedor respondería 503. "
                    + "Genéralo con GenerarHashVeedor (backend/src/test/.../infrastructure/security).");
        }

        if (!faltantes.isEmpty()) {
            throw new IllegalStateException(
                    "El perfil 'prod' no puede arrancar sin estos secretos:\n  - "
                            + String.join("\n  - ", faltantes));
        }

        // Advertencia y no error: M13 es opcional y el endpoint ya responde 503 por su cuenta
        // mientras no esté configurado, que es el comportamiento correcto para una integración
        // que no todo despliegue necesita.
        if (claveIot == null || claveIot.isBlank()) {
            log.warn("IOT_KEY no está configurada: /api/iot/presion responderá 503 (M13 deshabilitado).");
        }
    }
}
