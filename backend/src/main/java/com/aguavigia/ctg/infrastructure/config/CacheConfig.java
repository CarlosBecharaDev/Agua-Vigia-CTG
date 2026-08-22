package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.cache.CacheProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Habilita @Cacheable/@CacheEvict en toda la app (@EnableCaching) sobre un RedisCacheManager.
 * Valores en JSON (GenericJackson2JsonRedisSerializer), no serializacion Java: asi una entrada de
 * cache se puede inspeccionar con `redis-cli GET`, igual que el resto de las llaves del proyecto.
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(CacheProperties.class)
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory, CacheProperties propiedades) {
        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(propiedades.ttlPorDefectoSegundos()))
                // No cachear null: un valor ausente cacheado indefinidamente en un TTL largo
                // podria esconder que un dato real llegue despues.
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        serializadorDeValores()));

        Map<String, RedisCacheConfiguration> configPorCache = new HashMap<>();
        propiedades.ttlSegundosPorCache().forEach((nombreDelCache, segundos) ->
                configPorCache.put(nombreDelCache, base.entryTtl(Duration.ofSeconds(segundos))));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(base)
                .withInitialCacheConfigurations(configPorCache)
                .build();
    }

    /**
     * El ObjectMapper por defecto de GenericJackson2JsonRedisSerializer no trae el modulo de
     * java.time, asi que en cuanto un objeto cacheado gano un campo Instant (Sector.estadoActualizadoEn,
     * RF003) el guardado en cache empezaba a lanzar. Aqui se agrega JavaTimeModule y se escriben las
     * fechas en ISO-8601 y no como epoch, para que una entrada de cache siga siendo legible con
     * `redis-cli GET` — que es justo la razon por la que este cache usa JSON y no serializacion Java.
     *
     * El tipado por defecto se mantiene en EVERYTHING, como el del serializador original: los valores
     * viajan dentro de una List cuyo tipo de elemento se borra en tiempo de ejecucion, asi que sin el
     * `@class` de cada elemento no hay forma de reconstruir un `Sector` al leerlo de vuelta. El
     * validador acota que clases pueden instanciarse al deserializar, en vez de aceptar cualquiera.
     */
    private static GenericJackson2JsonRedisSerializer serializadorDeValores() {
        PolymorphicTypeValidator validador = BasicPolymorphicTypeValidator.builder()
                .allowIfSubType("com.aguavigia.ctg.")
                .allowIfSubType("java.util.")
                .allowIfSubType("java.time.")
                .allowIfSubType("java.lang.")
                .build();

        ObjectMapper mapper = JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .activateDefaultTyping(validador, ObjectMapper.DefaultTyping.EVERYTHING,
                        JsonTypeInfo.As.PROPERTY)
                .build();

        return new GenericJackson2JsonRedisSerializer(mapper);
    }
}
