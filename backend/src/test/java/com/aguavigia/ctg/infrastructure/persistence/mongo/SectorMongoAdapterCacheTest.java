package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.config.CacheConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * El cache de sectores contra Mongo y Redis reales. Se separa de SectorMongoAdapterTest porque
 * alli el adaptador se importa suelto, sin proxy de cache: mezclar ambos escenarios en una clase
 * haria que las pruebas de mapeo leyeran valores cacheados de la prueba anterior.
 *
 * Cada prueba borra la coleccion por debajo del adaptador para distinguir un acierto de cache de
 * una lectura nueva: si sigue devolviendo datos con Mongo vacio, vinieron de Redis.
 */
@Testcontainers
@DataMongoTest
@ImportAutoConfiguration(RedisAutoConfiguration.class)
@Import({SectorMongoAdapter.class, CacheConfig.class, SectorMongoAdapterCacheTest.RelojFijo.class})
class SectorMongoAdapterCacheTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    static class RelojFijo {
        @Bean
        RelojPort reloj() {
            return () -> Instant.parse("2026-08-09T15:30:00Z");
        }
    }

    // Por el puerto y no por la clase: con el cache activo el bean es un proxy dinamico sobre
    // SectorRepository, no una instancia de SectorMongoAdapter.
    @Autowired
    private SectorRepository adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RedisConnectionFactory connectionFactory;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("sectores").drop();
        try (RedisConnection conexion = connectionFactory.getConnection()) {
            conexion.serverCommands().flushDb();
        }
    }

    private void sembrar(String slug, String nombre) {
        mongoTemplate.getDb().getCollection("sectores").insertOne(new org.bson.Document()
                .append("slug", slug)
                .append("nombre", nombre)
                .append("poblacion", 5000));
    }

    @Test
    void debeServirLaSegundaLlamadaDesdeElCacheSinVolverAMongo() {
        sembrar("manga", "MANGA");
        adaptador.listarTodos();

        mongoTemplate.getDb().getCollection("sectores").drop();

        assertThat(adaptador.listarTodos()).extracting(Sector::nombre).containsExactly("MANGA");
    }

    @Test
    void debeReconstruirElSectorCompletoAlLeerloDelCache() {
        sembrar("bocagrande", "BOCAGRANDE");
        adaptador.listarTodos();
        mongoTemplate.getDb().getCollection("sectores").drop();

        // Ida y vuelta por el serializador JSON de Redis: un record anidado (SectorId) y un enum
        // nulo son justo lo que se rompe si el serializador cambia.
        Sector cacheado = adaptador.listarTodos().getFirst();

        assertThat(cacheado.id()).isEqualTo(new SectorId("bocagrande"));
        assertThat(cacheado.nombre()).isEqualTo("BOCAGRANDE");
        assertThat(cacheado.poblacion()).isEqualTo(5000);
        assertThat(cacheado.estadoActual()).isNull();
    }

    /**
     * El ObjectMapper por defecto de GenericJackson2JsonRedisSerializer no trae el modulo de
     * java.time: al agregarle a Sector el campo estadoActualizadoEn (RF003), escribir en el cache
     * empezo a lanzar InvalidDefinitionException. Sin esta prueba, el sintoma en produccion habria
     * sido el mapa entero fallando en la primera lectura despues de un cambio de estado.
     */
    @Test
    void debeSobrevivirLaFechaDelEstadoAlaIdaYVueltaPorElCache() {
        sembrar("manga", "MANGA");
        Sector sector = adaptador.listarTodos().getFirst();
        adaptador.guardar(sector.conEstado(EstadoServicio.SIN_SERVICIO));

        adaptador.listarTodos();                       // llena el cache
        mongoTemplate.getDb().getCollection("sectores").drop();
        Sector cacheado = adaptador.listarTodos().getFirst();   // ahora solo puede venir del cache

        assertThat(cacheado.estadoActual()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(cacheado.estadoActualizadoEn()).isNotNull();
    }

    @Test
    void debeInvalidarElCacheAlGuardarUnCambioDeEstado() {
        sembrar("manga", "MANGA");
        List<Sector> antes = adaptador.listarTodos();
        assertThat(antes.getFirst().estadoActual()).isNull();

        adaptador.guardar(antes.getFirst().conEstado(EstadoServicio.SIN_SERVICIO));

        assertThat(adaptador.listarTodos()).extracting(Sector::estadoActual)
                .containsExactly(EstadoServicio.SIN_SERVICIO);
    }
}
