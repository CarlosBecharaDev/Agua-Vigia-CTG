package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Lee "Authorization: Bearer <token>". Si falta o es inválido, sigue la cadena sin autenticar — es
 * SecurityConfig, no este filtro, quien decide si la ruta exige autenticación (el resto de la
 * plataforma es público, así que un token ausente no debe romper una ruta pública).
 *
 * Cada permiso se traduce a una autoridad `PERM_<nombre>`, que es contra lo que los controladores
 * declaran su `@PreAuthorize`. No se usan roles de Spring (`ROLE_`) a propósito: el sistema autoriza
 * por permiso, y tener las dos cosas invitaría a proteger unos endpoints por rol y otros por permiso.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final String PREFIJO_BEARER = "Bearer ";
    public static final String PREFIJO_AUTORIDAD = "PERM_";

    private final JwtProvider jwtProvider;
    private final RevocacionSesionPort revocacion;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, RevocacionSesionPort revocacion) {
        this.jwtProvider = jwtProvider;
        this.revocacion = revocacion;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain cadena) throws ServletException, IOException {
        String encabezado = request.getHeader("Authorization");

        if (encabezado != null && encabezado.startsWith(PREFIJO_BEARER)) {
            jwtProvider.validar(encabezado.substring(PREFIJO_BEARER.length()))
                    .filter(this::sigueVigente)
                    .ifPresent(JwtAuthenticationFilter::autenticar);
        }

        cadena.doFilter(request, response);
    }

    /**
     * Un token firmado y sin expirar puede haber quedado sin efecto: la cuenta se suspendió, le
     * cambiaron los permisos o alguien cerró sesión. Sin esta consulta, esos cambios tardarían
     * hasta 8 horas (RNF011) en notarse.
     *
     * `iat` de un JWT tiene precisión de segundo, así que la marca de revocación se compara también
     * truncada a segundos. La consecuencia es explícita: un token emitido dentro del mismo segundo
     * en que se revocó sobrevive. Se acepta ese margen de un segundo porque la alternativa —
     * redondear hacia arriba — mataría el token que la propia persona acaba de obtener al volver a
     * entrar, y dejaría el panel inutilizable después de cada cambio de permisos.
     *
     * Si Redis no responde, la sesión NO se da por buena: ver RedisRevocacionSesionAdapter.
     */
    private boolean sigueVigente(SesionAutenticada sesion) {
        try {
            return revocacion.revocadasAntesDe(sesion.id())
                    .map(revocadoEn -> !sesion.emitidoEn().isBefore(revocadoEn.truncatedTo(ChronoUnit.SECONDS)))
                    .orElse(true);
        } catch (RuntimeException noSePudoVerificar) {
            log.warn("Sesión rechazada: no se pudo verificar la revocación ({})",
                    noSePudoVerificar.getMessage());
            return false;
        }
    }

    private static void autenticar(SesionAutenticada sesion) {
        List<SimpleGrantedAuthority> autoridades = sesion.permisos().stream()
                .map(Permiso::name)
                .map(nombre -> new SimpleGrantedAuthority(PREFIJO_AUTORIDAD + nombre))
                .toList();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(sesion, null, autoridades));
    }
}
