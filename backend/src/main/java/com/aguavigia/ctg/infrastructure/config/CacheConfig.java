package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.cache.CacheProperties;
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
                        new GenericJackson2JsonRedisSerializer()));

        Map<String, RedisCacheConfiguration> configPorCache = new HashMap<>();
        propiedades.ttlSegundosPorCache().forEach((nombreDelCache, segundos) ->
                configPorCache.put(nombreDelCache, base.entryTtl(Duration.ofSeconds(segundos))));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(base)
                .withInitialCacheConfigurations(configPorCache)
                .build();
    }
}
