package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.ratelimit.RateLimitProperties;
import com.aguavigia.ctg.infrastructure.ratelimit.RateLimitingInterceptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Una regla = un interceptor registrado solo para su propio patron de ruta. Sin reglas
 * configuradas (lista vacia por defecto), no se registra ningun interceptor: cero cambio de
 * comportamiento para quien no pidio proteger nada.
 *
 * No cubre `/actuator/**`: los endpoints de Actuator se sirven por un HandlerMapping propio
 * (WebMvcEndpointHandlerMapping) que no recoge los interceptores de WebMvcConfigurer — verificado
 * en vivo, no es una suposicion. No hace falta protegerlos con esto de todas formas: solo `health`
 * esta expuesto (application.yml) y nadie querria poner un limite de peticiones a un healthcheck.
 */
@Configuration
@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig implements WebMvcConfigurer {

    private final RateLimitProperties propiedades;
    private final RedisTemplate<String, String> redis;

    public RateLimitConfig(RateLimitProperties propiedades,
                            @Qualifier("redisTemplate") RedisTemplate<String, String> redis) {
        this.propiedades = propiedades;
        this.redis = redis;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        for (RateLimitProperties.Regla regla : propiedades.reglas()) {
            registry.addInterceptor(new RateLimitingInterceptor(redis, regla))
                    .addPathPatterns(regla.ruta());
        }
    }
}
