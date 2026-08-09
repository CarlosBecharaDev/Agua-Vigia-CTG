package com.aguavigia.ctg.infrastructure.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.nio.charset.StandardCharsets;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(classes = {CacheConfig.class, ServicioCacheDePrueba.class})
@ImportAutoConfiguration(RedisAutoConfiguration.class)
@TestPropertySource(properties = {
        "aguavigia.cache.ttl-por-defecto-segundos=30",
        "aguavigia.cache.ttl-segundos-por-cache.prueba-corta=2"
})
class CacheConfigTest {

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @Autowired
    private ServicioCacheDePrueba servicio;

    @Autowired
    private RedisConnectionFactory connectionFactory;

    @BeforeEach
    void limpiarRedis() {
        try (RedisConnection conexion = connectionFactory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
        servicio.reiniciarInvocaciones();
    }

    @Test
    void debeReusarElValorCacheadoEnLaSegundaLlamada() {
        servicio.operacionConTtlPorDefecto("x");
        servicio.operacionConTtlPorDefecto("x");

        assertThat(servicio.invocaciones()).isEqualTo(1);
    }

    @Test
    void debeVolverAInvocarParaUnaClaveDistinta() {
        servicio.operacionConTtlPorDefecto("x");
        servicio.operacionConTtlPorDefecto("y");

        assertThat(servicio.invocaciones()).isEqualTo(2);
    }

    @Test
    void debeAplicarElTtlPorDefectoAlCacheSinOverride() {
        servicio.operacionConTtlPorDefecto("x");

        long ttl = ttlDeLaUnicaLlaveQueEmpiezaCon("prueba-default");

        assertThat(ttl).isGreaterThan(20).isLessThanOrEqualTo(30);
    }

    @Test
    void debeAplicarElTtlEspecificoConfiguradoParaEseCache() {
        servicio.operacionConTtlCorto("x");

        long ttl = ttlDeLaUnicaLlaveQueEmpiezaCon("prueba-corta");

        assertThat(ttl).isGreaterThan(0).isLessThanOrEqualTo(2);
    }

    private long ttlDeLaUnicaLlaveQueEmpiezaCon(String prefijo) {
        try (RedisConnection conexion = connectionFactory.getConnection()) {
            Set<byte[]> llaves = conexion.keyCommands().keys((prefijo + "*").getBytes(StandardCharsets.UTF_8));
            assertThat(llaves).hasSize(1);
            byte[] llave = llaves.iterator().next();
            Long ttl = conexion.keyCommands().ttl(llave);
            return ttl == null ? -1 : ttl;
        }
    }
}
