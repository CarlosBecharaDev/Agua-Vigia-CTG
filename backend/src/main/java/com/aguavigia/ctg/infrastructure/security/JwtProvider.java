package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.port.out.EmisorDeSesionPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Emite y valida el token del panel. RNF011: expiración máxima de 8 horas — se fija como constante
 * y no como configuración, porque relajarla no debería ser un cambio de una línea en application.yml
 * sino una decisión consciente contra otro RNF.
 *
 * El token lleva dentro los permisos ya resueltos. Es una decisión con contrapartida: ahorra una
 * lectura de Mongo en cada petición, pero significa que un cambio de permisos no alcanza a las
 * sesiones ya emitidas. Por eso AdministrarCuentaService revoca las sesiones en cuanto los cambia
 * —también al ampliarlos— y el filtro comprueba esa revocación en cada petición del panel. Sin esa
 * pareja de medidas, meter los permisos en el token sería un error.
 */
@Component
public class JwtProvider implements EmisorDeSesionPort {

    private static final Duration EXPIRACION = Duration.ofHours(8);

    static final String CLAIM_CORREO = "correo";
    static final String CLAIM_NOMBRE = "nombre";
    static final String CLAIM_ROL = "rol";
    static final String CLAIM_PERMISOS = "permisos";
    static final String CLAIM_ALCANCE = "alcance";

    private final String secreto;
    private final RelojPort reloj;

    public JwtProvider(@Value("${aguavigia.jwt.secret:}") String secreto, RelojPort reloj) {
        this.secreto = secreto;
        this.reloj = reloj;
    }

    @Override
    public String emitir(Usuario usuario, AlcanceSesion alcance) {
        // RelojPort y no Instant.now(): sin esto, comprobar que el token expira a las 8 horas
        // (RNF011) exigiría una prueba que espere 8 horas o que mockee el reloj del sistema.
        Instant ahora = reloj.ahora();

        Set<Permiso> permisos = alcance == AlcanceSesion.ALTA_SEGUNDO_FACTOR
                ? Set.of(Permiso.CONFIGURAR_SEGUNDO_FACTOR)
                : usuario.permisosEfectivos();

        return Jwts.builder()
                .subject(usuario.id().valor())
                .claim(CLAIM_CORREO, usuario.correo().valor())
                .claim(CLAIM_NOMBRE, usuario.nombre())
                .claim(CLAIM_ROL, usuario.permisos().rol().name())
                .claim(CLAIM_PERMISOS, permisos.stream().map(Permiso::name).sorted().toList())
                .claim(CLAIM_ALCANCE, alcance.name())
                // Con precisión de segundo, que es la del propio JWT: sin truncar, el `iat` que se
                // firma queda por debajo del instante en memoria y una revocación emitida en el
                // mismo segundo no alcanzaría al token que acaba de nacer.
                .issuedAt(java.util.Date.from(ahora))
                .expiration(java.util.Date.from(ahora.plus(EXPIRACION)))
                .signWith(clave())
                .compact();
    }

    /**
     * Vacío si el token es inválido, está expirado, no fue firmado con esta clave, o el propio
     * JWT_SECRET no está configurado. Nunca lanza — el filtro llama esto en toda petición que traiga
     * un header Authorization, incluidas las rutas públicas: un secreto mal configurado no puede
     * tumbar con un 500 una ruta que ni siquiera exige autenticación.
     */
    public Optional<SesionAutenticada> validar(String token) {
        try {
            Claims cuerpo = Jwts.parser()
                    // El mismo reloj que emite decide si expiró. Sin esto, emitir usaba RelojPort y
                    // validar el reloj del sistema: en una prueba con reloj fijo el token nacía ya
                    // vencido, y en producción cualquier deriva entre relojes sería intermitente.
                    .clock(() -> java.util.Date.from(reloj.ahora()))
                    .verifyWith(clave()).build()
                    .parseSignedClaims(token)
                    .getPayload();

            return Optional.of(new SesionAutenticada(
                    cuerpo.getSubject(),
                    cuerpo.get(CLAIM_CORREO, String.class),
                    cuerpo.get(CLAIM_NOMBRE, String.class),
                    cuerpo.get(CLAIM_ROL, String.class),
                    permisosDe(cuerpo),
                    AlcanceSesion.valueOf(cuerpo.get(CLAIM_ALCANCE, String.class)),
                    cuerpo.getIssuedAt().toInstant()));
        } catch (JwtException | IllegalArgumentException | IllegalStateException | NullPointerException tokenInvalido) {
            return Optional.empty();
        }
    }

    private static Set<Permiso> permisosDe(Claims cuerpo) {
        Object bruto = cuerpo.get(CLAIM_PERMISOS);
        if (!(bruto instanceof List<?> lista)) {
            return Set.of();
        }
        return lista.stream()
                .map(String::valueOf)
                .map(nombre -> {
                    try {
                        return Permiso.valueOf(nombre);
                    } catch (IllegalArgumentException permisoRetirado) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Se valida aquí y no en el constructor a propósito: JWT_SECRET vacío (el estado por defecto de
     * .env.example, sin configurar todavía) no debe tumbar el arranque de todo el backend — los
     * endpoints públicos no dependen de esto. Solo falla, y con un mensaje accionable, cuando
     * alguien de verdad intenta usar el panel sin haberlo configurado.
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
