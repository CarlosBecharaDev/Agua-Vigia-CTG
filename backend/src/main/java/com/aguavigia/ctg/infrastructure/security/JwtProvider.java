package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.port.out.RelojPort;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Emite y valida el token del panel del veedor. RNF011: expiracion maxima de 8 horas — se fija
 * como constante, no como configuracion, porque relajarla no deberia ser un cambio de una linea
 * en application.yml sino una decision consciente de otro RNF.
 */
@Component
public class JwtProvider {

    private static final Duration EXPIRACION = Duration.ofHours(8);
    private static final String SUJETO_VEEDOR = "veedor";

    private final String secreto;
    private final RelojPort reloj;

    public JwtProvider(@Value("${aguavigia.jwt.secret:}") String secreto, RelojPort reloj) {
        this.secreto = secreto;
        this.reloj = reloj;
    }

    public String emitirParaVeedor() {
        // RelojPort y no Instant.now(): sin esto, comprobar que el token expira a las 8 horas
        // (RNF011) exigiría una prueba que espere 8 horas o que mockee el reloj del sistema.
        Instant ahora = reloj.ahora();
        return Jwts.builder()
                .subject(SUJETO_VEEDOR)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(EXPIRACION)))
                .signWith(clave())
                .compact();
    }

    /**
     * Vacio si el token es invalido, esta expirado, no fue firmado con esta clave, o el propio
     * JWT_SECRET no esta configurado. Nunca lanza — el filtro llama esto en toda peticion que
     * traiga un header Authorization, incluidas las rutas publicas: un secreto mal configurado no
     * puede tumbar con un 500 una ruta que ni siquiera exige autenticacion.
     */
    public Optional<String> validarYObtenerSujeto(String token) {
        try {
            // El mismo reloj que emite decide si expiró. Sin esto, emitir usaba RelojPort y validar
            // el reloj del sistema: en una prueba con reloj fijo el token nacía ya vencido, y en
            // producción cualquier deriva entre ambos relojes sería un fallo intermitente.
            String sujeto = Jwts.parser()
                    .clock(() -> Date.from(reloj.ahora()))
                    .verifyWith(clave()).build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
            return Optional.ofNullable(sujeto);
        } catch (JwtException | IllegalArgumentException | IllegalStateException tokenInvalidoOSinConfigurar) {
            return Optional.empty();
        }
    }

    /**
     * Se valida aqui y no en el constructor a proposito: JWT_SECRET vacio (el estado por defecto
     * de .env.example, sin configurar todavia) no debe tumbar el arranque de todo el backend —
     * los endpoints publicos no dependen de esto. Solo falla, y con un mensaje accionable, cuando
     * alguien de verdad intenta usar el login del veedor sin haberlo configurado.
     */
    private SecretKey clave() {
        if (secreto == null || secreto.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "aguavigia.jwt.secret (variable JWT_SECRET) no esta configurado o mide menos "
                            + "de 32 bytes. HS256 lo exige. Genera uno con, por ejemplo: "
                            + "openssl rand -base64 32");
        }
        return Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
    }
}
