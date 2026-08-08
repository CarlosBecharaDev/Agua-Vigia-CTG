package com.aguavigia.ctg.infrastructure.persistence.redis;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.infrastructure.config.RedisConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.data.redis.DataRedisTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

/**
 * Prueba de integracion contra un Redis real (DoD de D3). Misma imagen que docker-compose.yml
 * (redis:7-alpine) para que lo que pasa aqui pase tambien en el entorno del equipo.
 */
@Testcontainers
@DataRedisTest
@Import({RedisConfig.class, RedisContadorReportesAdapter.class, RedisContadorReportesAdapterTest.RelojControlable.class})
class RedisContadorReportesAdapterTest {

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    static class RelojControlable {
        private Instant instante = Instant.parse("2026-08-08T15:30:00Z");

        void avanzar(Duration duracion) {
            instante = instante.plus(duracion);
        }

        @Bean
        RelojPort reloj() {
            return () -> instante;
        }
    }

    @Autowired
    private RedisContadorReportesAdapter adaptador;

    @Autowired
    private RelojControlable reloj;

    @Autowired
    @Qualifier("redisTemplate")
    private RedisTemplate<String, String> plantillaRedis;

    private static final SectorId MANGA = new SectorId("manga");
    private static final HuellaDispositivo HUELLA_A = new HuellaDispositivo("hash-dispositivo-a");
    private static final HuellaDispositivo HUELLA_B = new HuellaDispositivo("hash-dispositivo-b");

    /** El contenedor y el contexto de Spring se comparten entre pruebas: sin esto, los reportes
     * de una prueba contaminan el conteo de la siguiente. */
    @BeforeEach
    void limpiarRedis() {
        var factory = java.util.Objects.requireNonNull(plantillaRedis.getConnectionFactory());
        try (var conexion = factory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
    }

    @Test
    void debeContarCeroCuandoNadieHaReportadoElSector() {
        assertThat(adaptador.contarRecientes(MANGA, Duration.ofMinutes(30))).isZero();
    }

    @Test
    void debeContarLosReportesDentroDeLaVentana() {
        adaptador.registrar(MANGA, HUELLA_A);
        adaptador.registrar(MANGA, HUELLA_B);

        assertThat(adaptador.contarRecientes(MANGA, Duration.ofMinutes(30))).isEqualTo(2);
    }

    @Test
    void noDebeContarReportesAnterioresAlInicioDeLaVentana() {
        adaptador.registrar(MANGA, HUELLA_A);
        reloj.avanzar(Duration.ofMinutes(31));
        adaptador.registrar(MANGA, HUELLA_B);

        assertThat(adaptador.contarRecientes(MANGA, Duration.ofMinutes(30))).isEqualTo(1);
    }

    @Test
    void noDeduplicaPorHuella_elRateLimitingEsResponsabilidadDeOtraCapa() {
        adaptador.registrar(MANGA, HUELLA_A);
        adaptador.registrar(MANGA, HUELLA_A);
        adaptador.registrar(MANGA, HUELLA_A);

        assertThat(adaptador.contarRecientes(MANGA, Duration.ofMinutes(30))).isEqualTo(3);
    }

    @Test
    void debeMantenerContadoresIndependientesPorSector() {
        adaptador.registrar(MANGA, HUELLA_A);
        adaptador.registrar(new SectorId("bocagrande"), HUELLA_B);

        assertThat(adaptador.contarRecientes(MANGA, Duration.ofMinutes(30))).isEqualTo(1);
    }

    @Test
    void debeRechazarUnaVentanaMayorQueLaRetencionMaxima() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> adaptador.contarRecientes(MANGA, Duration.ofHours(25)));
    }
}
