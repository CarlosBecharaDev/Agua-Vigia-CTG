package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class RssCollectorTest {

    private static final String USER_AGENT = "AguaVigiaCTG-Bot/1.0 (+prueba@aguavigia.local)";
    private static final String URL_GOOGLE_NEWS = "https://news.google.com/rss/search?q=acuacar";
    private static final String URL_ZONA_CERO = "https://www.zonacero.com/rss.xml";
    private static final Instant DESDE = Instant.parse("2026-01-01T00:00:00Z");

    /** Forma real de Google News RSS y Zona Cero, verificada contra producción el 2026-08-08. */
    private static final String RSS_GOOGLE_NEWS = """
            <?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0"><channel>
              <item>
                <title>2846 - AVISO DE CORTE - acuacar.com</title>
                <link>https://news.google.com/rss/articles/xyz</link>
                <pubDate>Mon, 05 Jan 2026 22:34:18 GMT</pubDate>
                <description>&lt;a href="https://news.google.com/rss/articles/xyz"&gt;2846 - AVISO&lt;/a&gt;</description>
              </item>
            </channel></rss>
            """;

    private static final String RSS_ZONA_CERO_CON_CONTENT_ENCODED = """
            <?xml version="1.0" encoding="UTF-8"?>
            <rss xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0"><channel>
              <item>
                <title><![CDATA[Corte en Bocagrande]]></title>
                <link>http://zonacero.com/corte-bocagrande</link>
                <description></description>
                <content:encoded><![CDATA[<p>Corte <strong>programado</strong> hoy.</p>]]></content:encoded>
                <pubDate>Mon, 05 Jan 2026 08:00:00 +0000</pubDate>
              </item>
              <item>
                <title>Nota vieja fuera de ventana</title>
                <link>http://zonacero.com/vieja</link>
                <description>Texto viejo</description>
                <pubDate>Mon, 01 Dec 2025 08:00:00 +0000</pubDate>
              </item>
            </channel></rss>
            """;

    private record Montaje(RssCollector colector, MockRestServiceServer servidor) {
    }

    private Montaje montar(String userAgent, List<IngestaProperties.Feed> feeds) {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        IngestaProperties propiedades = new IngestaProperties(userAgent, 10_000, 15_000, null, feeds);
        return new Montaje(new RssCollector(restClient, propiedades), servidor);
    }

    @Test
    void debeCombinarVariosFeedsYPreferirContentEncodedSobreDescription() {
        Montaje montaje = montar(USER_AGENT, List.of(
                new IngestaProperties.Feed("google-news", URL_GOOGLE_NEWS),
                new IngestaProperties.Feed("zona-cero", URL_ZONA_CERO)));

        montaje.servidor()
                .expect(requestTo(URL_GOOGLE_NEWS))
                .andExpect(header(HttpHeaders.USER_AGENT, USER_AGENT))
                .andRespond(withSuccess(RSS_GOOGLE_NEWS, MediaType.APPLICATION_XML));
        montaje.servidor()
                .expect(requestTo(URL_ZONA_CERO))
                .andRespond(withSuccess(RSS_ZONA_CERO_CON_CONTENT_ENCODED, MediaType.APPLICATION_XML));

        List<DocumentoCrudo> documentos = montaje.colector().obtenerDesde(DESDE);

        assertThat(documentos).hasSize(2);
        assertThat(documentos).extracting(DocumentoCrudo::fuente).containsExactlyInAnyOrder("google-news", "zona-cero");

        DocumentoCrudo deZonaCero = documentos.stream().filter(d -> d.fuente().equals("zona-cero")).findFirst().orElseThrow();
        assertThat(deZonaCero.texto()).isEqualTo("Corte programado hoy.");
        assertThat(deZonaCero.titulo()).isEqualTo("Corte en Bocagrande");

        montaje.servidor().verify();
    }

    @Test
    void debeDescartarItemsAnterioresALaVentanaSolicitada() {
        Montaje montaje = montar(USER_AGENT, List.of(new IngestaProperties.Feed("zona-cero", URL_ZONA_CERO)));

        montaje.servidor()
                .expect(requestTo(URL_ZONA_CERO))
                .andRespond(withSuccess(RSS_ZONA_CERO_CON_CONTENT_ENCODED, MediaType.APPLICATION_XML));

        List<DocumentoCrudo> documentos = montaje.colector().obtenerDesde(DESDE);

        assertThat(documentos).hasSize(1);
        assertThat(documentos.get(0).titulo()).isEqualTo("Corte en Bocagrande");
    }

    @Test
    void unFeedCaidoNoDebeImpedirLeerLosDemas() {
        Montaje montaje = montar(USER_AGENT, List.of(
                new IngestaProperties.Feed("google-news", URL_GOOGLE_NEWS),
                new IngestaProperties.Feed("zona-cero", URL_ZONA_CERO)));

        montaje.servidor()
                .expect(requestTo(URL_GOOGLE_NEWS))
                .andRespond(withServerError());
        montaje.servidor()
                .expect(requestTo(URL_ZONA_CERO))
                .andRespond(withSuccess(RSS_ZONA_CERO_CON_CONTENT_ENCODED, MediaType.APPLICATION_XML));

        List<DocumentoCrudo> documentos = montaje.colector().obtenerDesde(DESDE);

        assertThat(documentos).hasSize(1);
        assertThat(documentos.get(0).fuente()).isEqualTo("zona-cero");
    }

    @Test
    void debeRechazarLaLlamadaSinUserAgentConfigurado() {
        Montaje montaje = montar("", List.of(new IngestaProperties.Feed("zona-cero", URL_ZONA_CERO)));

        assertThatThrownBy(() -> montaje.colector().obtenerDesde(DESDE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("COLLECTOR_USER_AGENT");

        montaje.servidor().verify();
    }
}
