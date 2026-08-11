package com.aguavigia.ctg.infrastructure.ingest;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.IOException;
import java.io.StringReader;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * L2 del pipeline (pipeline-ingesta-datos.md §2): Google News RSS + prensa/radio verificada
 * (auditoria-fuentes-de-datos.md §7 — Zona Cero, Caracol Radio, W Radio). El conjunto de feeds es
 * 100 % config-driven (aguavigia.ingesta.rss): agregar un medio nuevo ya verificado no toca código.
 *
 * Un feed caído no tumba a los demás, y un ítem malformado no tumba su feed — mismo principio de
 * aislamiento que pipeline-ingesta-datos.md §6 exige para ítems individuales, aplicado también a
 * nivel de fuente porque son sitios de terceros independientes.
 */
@Component
public class RssCollector implements FuenteDatosPort {

    private static final Logger log = LoggerFactory.getLogger(RssCollector.class);
    private static final DateTimeFormatter FORMATO_PUBDATE = DateTimeFormatter.RFC_1123_DATE_TIME;

    private final RestClient restClient;
    private final IngestaProperties propiedades;

    public RssCollector(@Qualifier("rssRestClient") RestClient restClient, IngestaProperties propiedades) {
        this.restClient = restClient;
        this.propiedades = propiedades;
    }

    /**
     * RNF005 — el cortacircuitos aquí protege contra el caso en que *todos* los feeds fallan a la
     * vez (sin red, sin User-Agent configurado): un feed suelto caído ya lo absorbe el try/catch de
     * `leerFeed` sin que este método llegue a lanzar, que es el aislamiento fino que M9 necesita.
     */
    @Retry(name = "colectores")
    @CircuitBreaker(name = "rss")
    @Override
    public List<DocumentoCrudo> obtenerDesde(Instant desde) {
        if (propiedades.userAgent() == null || propiedades.userAgent().isBlank()) {
            throw new IllegalStateException(
                    "COLLECTOR_USER_AGENT no está configurado: el colector no se identifica, así que no hace la petición (CLAUDE.md, ética de datos, punto 3)");
        }

        List<DocumentoCrudo> documentos = new ArrayList<>();
        for (IngestaProperties.Feed feed : propiedades.rss()) {
            try {
                documentos.addAll(leerFeed(feed, desde));
            } catch (Exception fallo) {
                log.warn("No se pudo leer el feed RSS '{}' ({}): {}", feed.fuente(), feed.url(), fallo.toString());
            }
        }
        return documentos;
    }

    private List<DocumentoCrudo> leerFeed(IngestaProperties.Feed feed, Instant desde) {
        String xml = restClient.get()
                .uri(feed.url())
                .header(HttpHeaders.USER_AGENT, propiedades.userAgent())
                .retrieve()
                .body(String.class);

        if (xml == null || xml.isBlank()) {
            return List.of();
        }

        NodeList items = parsear(xml).getElementsByTagName("item");
        List<DocumentoCrudo> documentos = new ArrayList<>();
        for (int i = 0; i < items.getLength(); i++) {
            try {
                DocumentoCrudo documento = aDocumentoCrudo(feed.fuente(), (Element) items.item(i), desde);
                if (documento != null) {
                    documentos.add(documento);
                }
            } catch (Exception fallo) {
                log.warn("Ítem descartado del feed '{}': {}", feed.fuente(), fallo.toString());
            }
        }
        return documentos;
    }

    private DocumentoCrudo aDocumentoCrudo(String fuente, Element item, Instant desde) {
        String pubDate = textoDe(item, "pubDate");
        Instant publicadoEn = parsearFecha(pubDate);
        if (publicadoEn == null || publicadoEn.isBefore(desde)) {
            return null;
        }

        String titulo = textoDe(item, "title");
        String contenido = textoDe(item, "content:encoded");
        String texto = (contenido != null && !contenido.isBlank()) ? contenido : textoDe(item, "description");
        String link = textoDe(item, "link");

        return DocumentoCrudo.de(fuente, link, publicadoEn, LimpiadorHtml.limpiar(titulo), LimpiadorHtml.limpiar(texto));
    }

    private static Instant parsearFecha(String pubDate) {
        if (pubDate == null || pubDate.isBlank()) {
            return null;
        }
        try {
            return Instant.from(FORMATO_PUBDATE.parse(pubDate.trim()));
        } catch (DateTimeParseException formatoInesperado) {
            return null;
        }
    }

    private static String textoDe(Element item, String etiqueta) {
        NodeList hijos = item.getElementsByTagName(etiqueta);
        if (hijos.getLength() == 0) {
            return null;
        }
        Node nodo = hijos.item(0);
        return nodo.getTextContent();
    }

    /** Protección XXE (OWASP): sin DOCTYPE, sin entidades externas — el XML viene de terceros. */
    private static Document parsear(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(new InputSource(new StringReader(xml)));
        } catch (ParserConfigurationException | SAXException | IOException fallo) {
            throw new IllegalStateException("No se pudo parsear el feed RSS", fallo);
        }
    }
}
