package com.aguavigia.ctg.infrastructure.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * `aguavigia.rate-limit.reglas` en application.yml. Lista vacia por defecto: sin reglas
 * configuradas, ninguna ruta queda protegida — es opt-in, no un comportamiento sorpresa.
 *
 * Ejemplo para el login del veedor (ADR-016, hueco senalado — no se activa aqui, cada perfil
 * decide su propio valor):
 * <pre>
 * aguavigia:
 *   rate-limit:
 *     reglas:
 *       - ruta: /api/veedor/sesion
 *         limite: 5
 *         ventana-segundos: 300
 * </pre>
 */
@ConfigurationProperties(prefix = "aguavigia.rate-limit")
public record RateLimitProperties(List<Regla> reglas) {

    public RateLimitProperties {
        reglas = reglas == null ? List.of() : List.copyOf(reglas);
    }

    /** ruta: patron Ant (mismo formato que @RequestMapping). limite peticiones por ventanaSegundos, por IP. */
    public record Regla(String ruta, int limite, int ventanaSegundos) {

        public Regla {
            if (ruta == null || ruta.isBlank()) {
                throw new IllegalArgumentException("Una regla de rate limiting debe declarar su ruta");
            }
            if (limite <= 0) {
                throw new IllegalArgumentException("El limite debe ser mayor que cero (ruta: " + ruta + ")");
            }
            if (ventanaSegundos <= 0) {
                throw new IllegalArgumentException("La ventana debe ser mayor que cero (ruta: " + ruta + ")");
            }
        }
    }
}
