package com.aguavigia.ctg.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee "Authorization: Bearer <token>". Si falta o es invalido, sigue la cadena sin autenticar —
 * es SecurityConfig, no este filtro, quien decide si la ruta exige autenticacion (RF019: el resto
 * de la plataforma es publico, asi que un token ausente no debe romper una ruta publica).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIJO_BEARER = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain cadena) throws ServletException, IOException {
        String encabezado = request.getHeader("Authorization");

        if (encabezado != null && encabezado.startsWith(PREFIJO_BEARER)) {
            String token = encabezado.substring(PREFIJO_BEARER.length());

            jwtProvider.validarYObtenerSujeto(token).ifPresent(sujeto -> {
                var autenticacion = new UsernamePasswordAuthenticationToken(
                        sujeto, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(autenticacion);
            });
        }

        cadena.doFilter(request, response);
    }
}
