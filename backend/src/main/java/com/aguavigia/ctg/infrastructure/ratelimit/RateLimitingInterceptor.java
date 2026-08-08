package com.aguavigia.ctg.infrastructure.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

/**
 * Una instancia por regla (RateLimitWebConfig crea una y la registra solo para su patron de
 * ruta), asi cada una solo necesita saber su propio limite — no interpreta cual regla aplica.
 *
 * Clave por IP del cliente, no por huella de dispositivo: request.getRemoteAddr() es confiable
 * porque docker-compose.yml expone el backend directo (puerto 8080), sin proxy inverso delante
 * todavia. Si eso cambia, esto necesita leer X-Forwarded-For con cuidado de no confiar en un
 * header que el propio cliente puede falsificar.
 */
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RedisTemplate<String, String> redis;
    private final RateLimitProperties.Regla regla;

    public RateLimitingInterceptor(RedisTemplate<String, String> redis, RateLimitProperties.Regla regla) {
        this.redis = redis;
        this.regla = regla;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                              @NonNull HttpServletResponse response,
                              @NonNull Object handler) {
        String clave = "rate-limit:" + regla.ruta() + ":" + request.getRemoteAddr();

        Long conteo = redis.opsForValue().increment(clave);
        if (conteo == null) {
            // Redis no disponible: no se bloquea el trafico por un problema de infraestructura
            // ajeno al cliente (mismo criterio que el resto de D3 — fallar sin interrumpir).
            return true;
        }
        if (conteo == 1L) {
            redis.expire(clave, Duration.ofSeconds(regla.ventanaSegundos()));
        }

        if (conteo > regla.limite()) {
            Long segundosRestantes = redis.getExpire(clave);
            response.setStatus(429);
            response.setHeader("Retry-After",
                    String.valueOf(segundosRestantes == null || segundosRestantes < 0
                            ? regla.ventanaSegundos() : segundosRestantes));
            response.setContentType("application/json");
            try {
                response.getWriter().write(
                        "{\"detail\":\"Demasiadas peticiones a " + regla.ruta()
                                + ". Intenta de nuevo en unos minutos.\"}");
            } catch (java.io.IOException noSePudoEscribirElCuerpo) {
                // La respuesta 429 y el header Retry-After ya se fijaron; el cuerpo es
                // informativo, no la señal que el cliente necesita para reintentar bien.
            }
            return false;
        }

        return true;
    }
}
