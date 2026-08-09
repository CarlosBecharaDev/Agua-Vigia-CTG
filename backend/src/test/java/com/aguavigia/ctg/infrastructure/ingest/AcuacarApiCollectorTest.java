package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AcuacarApiCollectorTest {

    private static final String BASE_URL = "https://www.acuacar.com/wp-json/wp/v2";
    private static final String USER_AGENT = "AguaVigiaCTG-Bot/1.0 (+prueba@aguavigia.local)";
    private static final Instant DESDE = Instant.parse("2026-01-01T00:00:00Z");

    private record Montaje(AcuacarApiCollector colector, MockRestServiceServer servidor) {
    }

    private Montaje montar(String userAgent, int tamanioPagina) {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        IngestaProperties propiedades = new IngestaProperties(userAgent, 10_000, 15_000,
                new IngestaProperties.Acuacar(BASE_URL, tamanioPagina), List.of());

        return new Montaje(new AcuacarApiCollector(restClient, propiedades), servidor);
    }

    @Test
    void debeMapearUnaSolaPaginaYLimpiarElHtml() {
        Montaje montaje = montar(USER_AGENT, 100);

        String json = """
                [
                  {
                    "id": 2846,
                    "date": "2026-01-05T08:00:00",
                    "link": "https://www.acuacar.com/2026/01/aviso-2846",
                    "title": { "rendered": "Suspensi&oacute;n programada" },
                    "content": { "rendered": "<p>Corte en <strong>Bocagrande</strong> &amp; Manga.</p>" }
                  }
                ]
                """;

        montaje.servidor()
                .expect(requestTo(containsString("/posts")))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.USER_AGENT, USER_AGENT))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON).header("X-WP-TotalPages", "1"));

        List<DocumentoCrudo> documentos = montaje.colector().obtenerDesde(DESDE);

        assertThat(documentos).hasSize(1);
        DocumentoCrudo documento = documentos.get(0);
        assertThat(documento.fuente()).isEqualTo("acuacar");
        assertThat(documento.urlOriginal()).isEqualTo("https://www.acuacar.com/2026/01/aviso-2846");
        assertThat(documento.titulo()).isEqualTo("Suspensión programada");
        assertThat(documento.texto()).isEqualTo("Corte en Bocagrande & Manga.");
        assertThat(documento.publicadoEn()).isEqualTo(Instant.parse("2026-01-05T13:00:00Z"));

        montaje.servidor().verify();
    }

    @Test
    void debePaginarHastaAgotarXWpTotalPages() {
        Montaje montaje = montar(USER_AGENT, 1);

        String pagina1 = """
                [{ "id": 1, "date": "2026-01-05T08:00:00", "link": "https://www.acuacar.com/p1",
                   "title": { "rendered": "Aviso 1" }, "content": { "rendered": "Texto 1" } }]
                """;
        String pagina2 = """
                [{ "id": 2, "date": "2026-01-06T08:00:00", "link": "https://www.acuacar.com/p2",
                   "title": { "rendered": "Aviso 2" }, "content": { "rendered": "Texto 2" } }]
                """;

        montaje.servidor()
                .expect(requestTo(containsString("page=1")))
                .andRespond(withSuccess(pagina1, MediaType.APPLICATION_JSON).header("X-WP-TotalPages", "2"));
        montaje.servidor()
                .expect(requestTo(containsString("page=2")))
                .andRespond(withSuccess(pagina2, MediaType.APPLICATION_JSON).header("X-WP-TotalPages", "2"));

        List<DocumentoCrudo> documentos = montaje.colector().obtenerDesde(DESDE);

        assertThat(documentos).extracting(DocumentoCrudo::titulo).containsExactly("Aviso 1", "Aviso 2");
        montaje.servidor().verify();
    }

    @Test
    void debeRechazarLaLlamadaSinUserAgentConfigurado() {
        Montaje montaje = montar("", 100);

        assertThatThrownBy(() -> montaje.colector().obtenerDesde(DESDE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("COLLECTOR_USER_AGENT");

        montaje.servidor().verify();
    }
}
