package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.infrastructure.config.RedisConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.data.redis.DataRedisTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DataRedisTest
@Import({RedisConfig.class, DeduplicadorReciente.class})
class DeduplicadorRecienteTest {

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @Autowired
    private DeduplicadorReciente deduplicador;

    @Autowired
    @Qualifier("redisTemplate")
    private RedisTemplate<String, String> plantillaRedis;

    @BeforeEach
    void limpiarRedis() {
        var factory = Objects.requireNonNull(plantillaRedis.getConnectionFactory());
        try (var conexion = factory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
    }

    @Test
    void unHashNuncaVistoNoDebeContarComoVistoRecientemente() {
        assertThat(deduplicador.yaVistoRecientemente("hash-nuevo")).isFalse();
    }

    @Test
    void unHashMarcadoDebeContarComoVistoRecientemente() {
        deduplicador.marcarComoVisto("hash-repetido");

        assertThat(deduplicador.yaVistoRecientemente("hash-repetido")).isTrue();
    }

    @Test
    void hashesDistintosNoDebenInterferirEntreSi() {
        deduplicador.marcarComoVisto("hash-a");

        assertThat(deduplicador.yaVistoRecientemente("hash-b")).isFalse();
    }
}
