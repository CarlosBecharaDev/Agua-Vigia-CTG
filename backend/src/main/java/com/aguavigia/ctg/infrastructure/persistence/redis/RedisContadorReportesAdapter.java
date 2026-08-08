package com.aguavigia.ctg.infrastructure.persistence.redis;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.ContadorReportesPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Ventana deslizante de reportes por sector (RF009-RF011), sobre un ZSET de Redis: score = instante
 * del reporte en epoch millis, member = identificador unico del evento.
 *
 * No deduplica por HuellaDispositivo a proposito: impedir que un mismo dispositivo infle el conteo
 * es responsabilidad del rate limiting (D3-backend-infraestructura.md Sprint 2, INCR+EXPIRE en el
 * borde HTTP), no de este contador. Mezclar ambos controles en una sola estructura haria que
 * cambiar uno rompiera el otro sin avisar.
 */
@Component
public class RedisContadorReportesAdapter implements ContadorReportesPort {

    /**
     * Cota de retencion del ZSET, no la ventana de consenso real (esa la decide el caso de uso de
     * D2, ej. los 30 min del brief). Sin este TTL una clave de un sector que dejo de recibir
     * reportes viviria en Redis para siempre — D3-backend-infraestructura.md §4 pide TTL en toda
     * llave de Redis para no agotar memoria en un plan cloud.
     */
    private static final Duration RETENCION_MAXIMA = Duration.ofHours(24);

    private final RedisTemplate<String, String> redis;
    private final RelojPort reloj;

    // Spring Boot registra ademas un bean "stringRedisTemplate" (StringRedisTemplate) que tambien
    // es asignable a RedisTemplate<String, String> — sin el calificador, cualquier inyeccion por
    // tipo es ambigua entre los dos.
    public RedisContadorReportesAdapter(@Qualifier("redisTemplate") RedisTemplate<String, String> redis,
                                         RelojPort reloj) {
        this.redis = redis;
        this.reloj = reloj;
    }

    @Override
    public void registrar(SectorId sectorId, HuellaDispositivo huella) {
        String clave = clave(sectorId);
        long ahoraMillis = reloj.ahora().toEpochMilli();
        // huella.hash() viaja en el member solo para depuracion manual en Redis; contarRecientes
        // no lo lee. El UUID garantiza que dos reportes en el mismo milisegundo no se pisen.
        String miembro = huella.hash() + ":" + ahoraMillis + ":" + UUID.randomUUID();

        redis.opsForZSet().add(clave, miembro, ahoraMillis);
        redis.opsForZSet().removeRangeByScore(clave, 0,
                ahoraMillis - RETENCION_MAXIMA.toMillis());
        redis.expire(clave, RETENCION_MAXIMA);
    }

    @Override
    public long contarRecientes(SectorId sectorId, Duration ventana) {
        if (ventana.compareTo(RETENCION_MAXIMA) > 0) {
            // Un llamador no puede pedir una ventana mayor a lo que este adaptador retiene: los
            // eventos mas viejos que RETENCION_MAXIMA ya se podaron y el conteo mentiria por defecto.
            throw new IllegalArgumentException(
                    "La ventana solicitada (%s) supera la retencion maxima del contador (%s)"
                            .formatted(ventana, RETENCION_MAXIMA));
        }

        Instant ahora = reloj.ahora();
        long desde = ahora.minus(ventana).toEpochMilli();
        Long total = redis.opsForZSet().count(clave(sectorId), desde, ahora.toEpochMilli());
        return total == null ? 0L : total;
    }

    private static String clave(SectorId sectorId) {
        return "consenso:sector:" + sectorId.valor();
    }
}
