package com.aguavigia.ctg.infrastructure.ingest;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * L1 del pipeline (pipeline-ingesta-datos.md §2): WP REST API de acuacar.com, la fuente
 * autoritativa. El robots.txt del sitio (verificado, §1 del mismo documento) solo excluye
 * /wp-admin/ — este colector solo lee /wp-json/wp/v2/posts, nunca esa ruta.
 *
 * "after" en la API de WordPress filtra por fecha de publicación en la zona horaria del sitio, que
 * es la de Cartagena — de ahí America/Bogota en vez de UTC (CLAUDE.md: fecha del proyecto en hora
 * local de Cartagena).
 */
@Component
public class AcuacarApiCollector implements FuenteDatosPort {

    private static final Logger log = LoggerFactory.getLogger(AcuacarApiCollector.class);

    private static final String FUENTE = "acuacar";
    private static final ZoneId ZONA_CARTAGENA = ZoneId.of("America/Bogota");
    private static final DateTimeFormatter FORMATO_FECHA_WP = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final RestClient restClient;
    private final IngestaProperties propiedades;

    public AcuacarApiCollector(@Qualifier("acuacarRestClient") RestClient restClient, IngestaProperties propiedades) {
        this.restClient = restClient;
        this.propiedades = propiedades;
    }

    /**
     * RNF005 — reintento con retroceso exponencial y cortacircuitos tras 3 fallos consecutivos.
     * Cuando el circuito está abierto, la llamada lanza `CallNotPermittedException` y
     * `PipelineOrquestador` la trata como cualquier otro fallo del colector: ese ciclo sigue con las
     * demás fuentes en vez de golpear un sitio que ya se sabe caído.
     */
    @Retry(name = "colectores")
    @CircuitBreaker(name = "acuacar")
    @Override
    public List<DocumentoCrudo> obtenerDesde(Instant desde) {
        if (propiedades.userAgent() == null || propiedades.userAgent().isBlank()) {
            throw new IllegalStateException(
                    "COLLECTOR_USER_AGENT no está configurado: el colector no se identifica, así que no hace la petición (CLAUDE.md, ética de datos, punto 3)");
        }

        String desdeIso = LocalDateTime.ofInstant(desde, ZONA_CARTAGENA).format(FORMATO_FECHA_WP);
        int tamanioPagina = propiedades.acuacar().tamanioPagina();

        List<DocumentoCrudo> documentos = new ArrayList<>();
        int pagina = 1;
        int totalPaginas;
        do {
            Pagina resultado = pedirPagina(desdeIso, tamanioPagina, pagina);
            resultado.items().stream()
                    .map(this::aDocumentoCrudoOVacio)
                    .flatMap(Optional::stream)
                    .forEach(documentos::add);
            totalPaginas = resultado.totalPaginas();
            pagina++;
        } while (pagina <= totalPaginas);

        return documentos;
    }

    private Pagina pedirPagina(String desdeIso, int tamanioPagina, int pagina) {
        ResponseEntity<PostAcuacar[]> respuesta = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/posts")
                        .queryParam("after", desdeIso)
                        .queryParam("per_page", tamanioPagina)
                        .queryParam("page", pagina)
                        .queryParam("orderby", "date")
                        .queryParam("order", "asc")
                        // `_links` es obligatorio para que `_embed` funcione: WordPress construye
                        // `_embedded` a partir de los enlaces del recurso, así que si `_fields` los
                        // recorta devuelve el post sin `_embedded` y sin decir por qué. Verificado
                        // contra la API real el 30/08/2026: sin `_links` la respuesta trae solo
                        // id/date/link/title/content y la portada se pierde en silencio.
                        .queryParam("_fields", "id,date,link,title,content,_links,_embedded")
                        .queryParam("_embed", "wp:featuredmedia")
                        .build())
                .header(HttpHeaders.USER_AGENT, propiedades.userAgent())
                .retrieve()
                .toEntity(PostAcuacar[].class);

        PostAcuacar[] cuerpo = respuesta.getBody();
        List<PostAcuacar> items = cuerpo == null ? List.of() : List.of(cuerpo);
        return new Pagina(items, totalPaginas(respuesta.getHeaders()));
    }

    private static int totalPaginas(HttpHeaders headers) {
        String valor = headers.getFirst("X-WP-TotalPages");
        if (valor == null || valor.isBlank()) {
            return 1;
        }
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException noEsUnNumero) {
            return 1;
        }
    }

    /**
     * Un boletín sin cuerpo se salta, no tumba la fuente. `DocumentoCrudo` exige texto y lanza si no
     * lo hay; al recuperar el histórico completo (317 boletines desde 2020) basta **uno** con el
     * contenido vacío para que la excepción salga de `obtenerDesde` y `PipelineOrquestador` dé por
     * caído al colector entero, perdiendo los otros 316. Se registra a nivel debug porque es un dato
     * de la fuente, no una anomalía nuestra.
     */
    private Optional<DocumentoCrudo> aDocumentoCrudoOVacio(PostAcuacar post) {
        String texto = LimpiadorHtml.limpiar(post.content().rendered());
        if (texto == null || texto.isBlank()) {
            log.debug("Boletín {} de Acuacar sin contenido utilizable, se salta", post.id());
            return Optional.empty();
        }
        Instant publicadoEn = LocalDateTime.parse(post.date(), FORMATO_FECHA_WP)
                .atZone(ZONA_CARTAGENA)
                .toInstant();
        return Optional.of(DocumentoCrudo.de(FUENTE, post.link(), publicadoEn,
                LimpiadorHtml.limpiar(post.title().rendered()), texto, portadaDe(post)));
    }

    /**
     * Portada del boletín. Se prefiere el tamaño `medium` sobre el original: la tarjeta de la
     * bitácora la muestra a 16/9 en pocas centenas de píxeles, y el original de WordPress suele
     * pesar varios megabytes.
     */
    private static String portadaDe(PostAcuacar post) {
        if (post.embedded() == null || post.embedded().featuredMedia() == null) {
            return null;
        }
        return post.embedded().featuredMedia().stream()
                .filter(java.util.Objects::nonNull)
                .map(medio -> {
                    String mediano = medio.mediaDetails() == null || medio.mediaDetails().sizes() == null
                            || medio.mediaDetails().sizes().medium() == null
                            ? null
                            : medio.mediaDetails().sizes().medium().sourceUrl();
                    return mediano != null ? mediano : medio.sourceUrl();
                })
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse(null);
    }

    private record Pagina(List<PostAcuacar> items, int totalPaginas) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Embedded(@com.fasterxml.jackson.annotation.JsonProperty("wp:featuredmedia") List<Medio> featuredMedia) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Medio(@com.fasterxml.jackson.annotation.JsonProperty("source_url") String sourceUrl,
                 @com.fasterxml.jackson.annotation.JsonProperty("media_details") DetallesMedio mediaDetails) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record DetallesMedio(Tamanios sizes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Tamanios(Tamanio medium) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Tamanio(@com.fasterxml.jackson.annotation.JsonProperty("source_url") String sourceUrl) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PostAcuacar(long id, String date, String link, CampoRenderizado title, CampoRenderizado content,
                       @com.fasterxml.jackson.annotation.JsonProperty("_embedded") Embedded embedded) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CampoRenderizado(String rendered) {
    }
}
