package com.aguavigia.ctg.infrastructure.ingest;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    private static final String FUENTE = "acuacar";
    private static final ZoneId ZONA_CARTAGENA = ZoneId.of("America/Bogota");
    private static final DateTimeFormatter FORMATO_FECHA_WP = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final RestClient restClient;
    private final IngestaProperties propiedades;

    public AcuacarApiCollector(@Qualifier("acuacarRestClient") RestClient restClient, IngestaProperties propiedades) {
        this.restClient = restClient;
        this.propiedades = propiedades;
    }

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
            resultado.items().stream().map(this::aDocumentoCrudo).forEach(documentos::add);
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
                        .queryParam("_fields", "id,date,link,title,content")
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

    private DocumentoCrudo aDocumentoCrudo(PostAcuacar post) {
        Instant publicadoEn = LocalDateTime.parse(post.date(), FORMATO_FECHA_WP)
                .atZone(ZONA_CARTAGENA)
                .toInstant();
        return DocumentoCrudo.de(FUENTE, post.link(), publicadoEn,
                LimpiadorHtml.limpiar(post.title().rendered()), LimpiadorHtml.limpiar(post.content().rendered()));
    }

    private record Pagina(List<PostAcuacar> items, int totalPaginas) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PostAcuacar(long id, String date, String link, CampoRenderizado title, CampoRenderizado content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CampoRenderizado(String rendered) {
    }
}
