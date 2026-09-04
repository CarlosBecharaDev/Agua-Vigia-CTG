package com.aguavigia.ctg.infrastructure.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;

import java.util.Objects;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Extremo a extremo: confirma que RateLimitConfig registra el interceptor en el patron de ruta
 * correcto (no solo que RateLimitingInterceptor funcione aislado, ya cubierto en su propia prueba).
 */
@Testcontainers
@WebMvcTest(controllers = ControladorDePruebaRateLimit.class)
@ImportAutoConfiguration(RedisAutoConfiguration.class)
@Import({RedisConfig.class, RateLimitConfig.class, SecurityConfig.class})
@TestPropertySource(properties = {
        "aguavigia.rate-limit.reglas[0].ruta=/protegida",
        "aguavigia.rate-limit.reglas[0].limite=2",
        "aguavigia.rate-limit.reglas[0].ventana-segundos=60"
})
class RateLimitConfigTest {

    // SecurityConfig construye JwtAuthenticationFilter con este puerto: el filtro consulta la
    // revocacion en cada peticion con token (ADR-039). Sin el bean, el contexto del slice no carga.
    @MockitoBean
    private RevocacionSesionPort revocacion;

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @Autowired
    private MockMvc mockMvc;

    // SecurityConfig exige un JwtProvider para construir su SecurityFilterChain, aunque este test
    // no ejercite autenticacion — sin el, el contexto no levanta.
    @MockitoBean
    private JwtProvider jwtProvider;

    @Autowired
    @Qualifier("redisTemplate")
    private RedisTemplate<String, String> redisTemplate;

    @BeforeEach
    void limpiarRedis() {
        var factory = Objects.requireNonNull(redisTemplate.getConnectionFactory());
        try (var conexion = factory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
    }

    @Test
    void laRutaConfiguradaDebeRechazarLaPeticionQueSuperaElLimite() throws Exception {
        mockMvc.perform(get("/protegida")).andExpect(status().isOk());
        mockMvc.perform(get("/protegida")).andExpect(status().isOk());

        mockMvc.perform(get("/protegida"))
                .andExpect(status().is(429))
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void unaRutaSinReglaConfiguradaNuncaDebeLimitarse() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/sin-proteger")).andExpect(status().isOk());
        }
    }
}
