package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.ingest.IngestaProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Timeouts explícitos de conexión y lectura (pipeline-ingesta-datos.md §6: "respuesta lenta que
 * nunca cierra" es un modo de fallo con protección propia, no un detalle de configuración).
 *
 * El User-Agent NO se pone aquí como header por defecto: lo pone cada colector en su propia
 * petición, junto a su propio guard que se niega a llamar sin él configurado (CLAUDE.md, ética de
 * datos, punto 3). Ponerlo aquí también dejaría la regla partida entre dos clases — si este bean
 * cambiara sin que alguien recordara la relación, un colector podría llamar sin identificarse sin
 * que su propio guard lo note.
 */
@Configuration
@EnableConfigurationProperties(IngestaProperties.class)
public class IngestaConfig {

    @Bean
    public RestClient acuacarRestClient(IngestaProperties propiedades) {
        return RestClient.builder()
                .baseUrl(propiedades.acuacar().baseUrl())
                .requestFactory(fabricaConTimeouts(propiedades))
                .build();
    }

    /** Sin baseUrl: cada feed de aguavigia.ingesta.rss trae su URL completa (medios distintos). */
    @Bean
    public RestClient rssRestClient(IngestaProperties propiedades) {
        return RestClient.builder()
                .requestFactory(fabricaConTimeouts(propiedades))
                .build();
    }

    private static SimpleClientHttpRequestFactory fabricaConTimeouts(IngestaProperties propiedades) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) propiedades.conexionTimeoutMs());
        factory.setReadTimeout((int) propiedades.lecturaTimeoutMs());
        return factory;
    }
}
