package com.aguavigia.ctg.infrastructure.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Diagnosticar un fallo en produccion era leer texto plano sin forma de agrupar las lineas de una
 * misma peticion (estado-del-backend.md #6.1). Este filtro pone un identificador en MDC antes de
 * que corra cualquier otro codigo de la peticion, para que `logging.structured.format.console=ecs`
 * (application.yml) lo incluya en cada linea JSON.
 *
 * `HIGHEST_PRECEDENCE`: tiene que fijarse antes que cualquier log de RateLimitingInterceptor o de
 * los controladores, si no las primeras lineas de la peticion quedan sin correlationId.
 */
@Component
public class CorrelationIdFilter extends OncePerRequestFilter implements Ordered {

    public static final String CABECERA = "X-Correlation-Id";
    public static final String CLAVE_MDC = "correlationId";

    /**
     * Un id que viene del cliente es entrada no confiable: sin este patron, cualquiera podria
     * inyectar texto arbitrario (o kilobytes de basura) en cada linea de log de su propia peticion.
     */
    private static final Pattern FORMATO_VALIDO = Pattern.compile("[A-Za-z0-9-]{1,64}");

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain cadena) throws ServletException, IOException {
        String recibido = request.getHeader(CABECERA);
        String correlationId = StringUtils.hasText(recibido) && FORMATO_VALIDO.matcher(recibido).matches()
                ? recibido
                : UUID.randomUUID().toString();

        MDC.put(CLAVE_MDC, correlationId);
        response.setHeader(CABECERA, correlationId);
        try {
            cadena.doFilter(request, response);
        } finally {
            MDC.remove(CLAVE_MDC);
        }
    }
}
