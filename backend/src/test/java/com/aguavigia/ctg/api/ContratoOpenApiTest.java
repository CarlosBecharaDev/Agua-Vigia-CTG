package com.aguavigia.ctg.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * `backend/openapi.yaml` es la compuerta C2: el contrato versionado del que D4 genera su cliente.
 * Se genera con la aplicación corriendo y se comitea a mano, así que nada garantizaba que siguiera
 * al día — un endpoint nuevo sin regenerar y el frontend queda programando contra un contrato que
 * ya no existe.
 *
 * Se comparan las **rutas**, no el YAML entero: un cambio de redacción en una descripción no
 * debería romper la build, pero un endpoint que aparece o desaparece sí.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        // MailSenderAutoConfiguration solo crea el JavaMailSender si hay host; aquí no se envía
        // ningún correo, solo hace falta que el contexto pueda construir MailNotificacionAdapter.
        "spring.mail.host=localhost",
        "spring.mail.port=3025",
        // El ciclo de ingesta no debe salir a la red durante esta prueba. COLLECTOR_USER_AGENT
        // viaja vacío por defecto, así que los dos colectores se niegan a llamar y
        // PipelineOrquestador los absorbe — el intervalo largo es la segunda línea.
        "aguavigia.ingesta.user-agent=",
        "aguavigia.ingesta.intervalo-ms=86400000",
        "aguavigia.rate-limit.reglas="
})
class ContratoOpenApiTest {

    private static final Path CONTRATO = Path.of("openapi.yaml");
    private static final Pattern RUTA_EN_JSON = Pattern.compile("\"(/api/[^\"]*)\"\\s*:\\s*\\{");
    private static final Pattern RUTA_EN_YAML = Pattern.compile("(?m)^  (/api/\\S*):\\s*$");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Container
    @ServiceConnection(name = "redis")
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @Autowired
    private MockMvc mockMvc;

    @Test
    void elContratoVersionadoDebeCoincidirConLoQueElBackendExponeDeVerdad() throws Exception {
        String contratoVivo = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Set<String> rutasReales = extraer(RUTA_EN_JSON, contratoVivo);
        Set<String> rutasVersionadas = extraer(RUTA_EN_YAML, Files.readString(CONTRATO));

        assertThat(rutasReales)
                .as("""
                        backend/openapi.yaml quedó desincronizado con el código.
                        Regeneralo con la aplicación corriendo:
                          curl -s http://localhost:8080/v3/api-docs.yaml -o backend/openapi.yaml
                        """)
                .isEqualTo(rutasVersionadas);
    }

    @Test
    void elContratoDebePublicarLasRutasQueConsumeElFrontend() throws Exception {
        String contratoVivo = mockMvc.perform(get("/v3/api-docs")).andReturn()
                .getResponse().getContentAsString();

        assertThat(extraer(RUTA_EN_JSON, contratoVivo)).contains(
                "/api/sectores", "/api/reportes", "/api/suscripciones", "/api/bitacora",
                "/api/estadisticas", "/api/cumplimiento");
    }

    private static Set<String> extraer(Pattern patron, String texto) {
        Set<String> rutas = new TreeSet<>();
        Matcher coincidencia = patron.matcher(texto);
        while (coincidencia.find()) {
            rutas.add(coincidencia.group(1));
        }
        return rutas;
    }

    /** Sanity check del propio test: si los patrones dejaran de encontrar rutas, compararía dos
     * conjuntos vacíos y pasaría siempre. */
    @Test
    void elPropioTestDebeEncontrarRutasEnAmbosFormatos() throws Exception {
        String contratoVivo = mockMvc.perform(get("/v3/api-docs")).andReturn()
                .getResponse().getContentAsString();

        assertThat(extraer(RUTA_EN_JSON, contratoVivo)).hasSizeGreaterThan(10);
        assertThat(extraer(RUTA_EN_YAML, Files.readString(CONTRATO))).hasSizeGreaterThan(10);
    }

    /** Documentación viva: si alguien agrega un controlador, esta lista se lo recuerda. */
    @Test
    void todoControladorPublicoDebeEstarEnElContrato() throws Exception {
        String contratoVivo = mockMvc.perform(get("/v3/api-docs")).andReturn()
                .getResponse().getContentAsString();
        Set<String> rutas = extraer(RUTA_EN_JSON, contratoVivo);

        List.of("/api/veedor/ingesta/propuestas", "/api/veedor/ingesta/salud",
                        "/api/cumplimiento/serie", "/api/estadisticas/exportar.csv", "/api/v2/requests.json")
                .forEach(ruta -> assertThat(rutas)
                        .as("La ruta %s no aparece en el contrato", ruta)
                        .anyMatch(publicada -> publicada.startsWith(ruta)));
    }
}
