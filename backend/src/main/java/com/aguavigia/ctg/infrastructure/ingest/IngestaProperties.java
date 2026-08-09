package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * `aguavigia.ingesta` en application.yml. `userAgent` viaja vacío por defecto (lee
 * COLLECTOR_USER_AGENT, sin valor forzado aquí) para que el resto del backend arranque igual sin
 * él configurado — el colector se niega a llamar a la red sin identificarse, pero eso se valida al
 * usarse, no al levantar la aplicación (mismo patrón que JwtProvider y VeedorAuthController).
 *
 * Los timeouts son compartidos por todos los colectores (pipeline-ingesta-datos.md §6: toda
 * petición saliente necesita conexión y lectura acotadas), no algo propio de Acuacar.
 */
@ConfigurationProperties(prefix = "aguavigia.ingesta")
public record IngestaProperties(String userAgent, long conexionTimeoutMs, long lecturaTimeoutMs,
                                 Acuacar acuacar, List<Feed> rss) {

    public IngestaProperties {
        if (conexionTimeoutMs <= 0) {
            conexionTimeoutMs = 10_000;
        }
        if (lecturaTimeoutMs <= 0) {
            lecturaTimeoutMs = 15_000;
        }
        if (acuacar == null) {
            acuacar = new Acuacar(null, 0);
        }
        rss = rss == null ? List.of() : List.copyOf(rss);
    }

    /** Un feed RSS verificado (auditoria-fuentes-de-datos.md §7): fuente = etiqueta, url = feed completo. */
    public record Feed(String fuente, String url) {

        public Feed {
            if (fuente == null || fuente.isBlank()) {
                throw new IllegalArgumentException("Un feed RSS debe declarar su fuente");
            }
            if (url == null || url.isBlank()) {
                throw new IllegalArgumentException("El feed '" + fuente + "' debe declarar su url");
            }
        }
    }

    public record Acuacar(String baseUrl, int tamanioPagina) {

        private static final String BASE_URL_POR_DEFECTO = "https://www.acuacar.com/wp-json/wp/v2";

        public Acuacar {
            if (baseUrl == null || baseUrl.isBlank()) {
                baseUrl = BASE_URL_POR_DEFECTO;
            }
            if (tamanioPagina <= 0) {
                tamanioPagina = 100;
            }
        }
    }
}
