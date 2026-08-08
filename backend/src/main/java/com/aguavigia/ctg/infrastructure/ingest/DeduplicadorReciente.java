package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Mitad "rapida" de la deduplicacion (pipeline-ingesta-datos.md §3, etapa 2): "Set de hashes
 * recientes en Redis para el chequeo rapido". Deliberadamente NO permanente ni autoritativa — la
 * otra mitad del diseño ("¿el hash ya existe en Mongo? -> descartar") depende de donde el equipo
 * decida persistir los documentos u eventos procesados, decision todavia sin tomar (BL-004 en
 * registro-de-bloqueos.md). Este componente sirve igual mientras tanto: evita reprocesar el mismo
 * boletin republicado en la misma semana, que es el caso mas comun y mas barato de evitar.
 */
@Component
public class DeduplicadorReciente {

    private static final Duration VENTANA = Duration.ofDays(7);
    private static final String PREFIJO = "ingesta:visto:";

    private final RedisTemplate<String, String> redis;

    public DeduplicadorReciente(@Qualifier("redisTemplate") RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    public boolean yaVistoRecientemente(String hash) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIJO + hash));
    }

    public void marcarComoVisto(String hash) {
        redis.opsForValue().set(PREFIJO + hash, "", VENTANA);
    }
}
