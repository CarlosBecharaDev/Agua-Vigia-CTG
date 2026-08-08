package com.aguavigia.ctg.infrastructure.ratelimit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.data.redis.DataRedisTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Contra Redis real, no mockeado: INCR+EXPIRE es exactamente el tipo de logica que un mock
 * podria dar por buena mientras el comando real hace otra cosa.
 */
@Testcontainers
@DataRedisTest
@Import(com.aguavigia.ctg.infrastructure.config.RedisConfig.class)
class RateLimitingInterceptorTest {

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    private static final RateLimitProperties.Regla REGLA_DE_PRUEBA =
            new RateLimitProperties.Regla("/api/veedor/sesion", 3, 60);

    @Autowired
    @Qualifier("redisTemplate")
    private RedisTemplate<String, String> plantillaRedis;

    private RateLimitingInterceptor interceptor;

    @BeforeEach
    void preparar() {
        var factory = Objects.requireNonNull(plantillaRedis.getConnectionFactory());
        try (var conexion = factory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
        interceptor = new RateLimitingInterceptor(plantillaRedis, REGLA_DE_PRUEBA);
    }

    private MockHttpServletRequest peticionDesde(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void debePermitirPeticionesDentroDelLimite() {
        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            boolean continua = interceptor.preHandle(peticionDesde("10.0.0.1"), response, new Object());

            assertThat(continua).isTrue();
            assertThat(response.getStatus()).isEqualTo(200); // default de MockHttpServletResponse
        }
    }

    @Test
    void debeRechazarLaPeticionQueSuperaElLimiteCon429() {
        for (int i = 0; i < 3; i++) {
            interceptor.preHandle(peticionDesde("10.0.0.2"), new MockHttpServletResponse(), new Object());
        }

        MockHttpServletResponse cuarta = new MockHttpServletResponse();
        boolean continua = interceptor.preHandle(peticionDesde("10.0.0.2"), cuarta, new Object());

        assertThat(continua).isFalse();
        assertThat(cuarta.getStatus()).isEqualTo(429);
        assertThat(cuarta.getHeader("Retry-After")).isNotNull();
    }

    @Test
    void debeContarCadaIpPorSeparado() {
        for (int i = 0; i < 3; i++) {
            interceptor.preHandle(peticionDesde("10.0.0.3"), new MockHttpServletResponse(), new Object());
        }

        MockHttpServletResponse respuestaOtraIp = new MockHttpServletResponse();
        boolean continua = interceptor.preHandle(peticionDesde("10.0.0.4"), respuestaOtraIp, new Object());

        assertThat(continua).isTrue();
    }
}
