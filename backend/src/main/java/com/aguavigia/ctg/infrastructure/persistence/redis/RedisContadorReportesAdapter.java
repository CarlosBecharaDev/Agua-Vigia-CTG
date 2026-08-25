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

/**
 * Ventana deslizante de reportes por sector (RF009-RF011), sobre un ZSET de Redis: score = instante
 * del reporte en epoch millis, member = identificador unico del evento.
 *
 * El miembro del ZSET es la huella del dispositivo: varios reportes del mismo aparato actualizan
 * su instante, pero cuentan una sola vez para el consenso. El rate limiting sigue siendo un control
 * separado: limita la frecuencia, mientras este contador garantiza independencia de actores.
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
        // ZADD reemplaza el score del mismo miembro. De este modo un celular no puede alcanzar por
        // si solo el umbral minimo enviando tres reportes permitidos por RF006.
        redis.opsForZSet().add(clave, huella.hash(), ahoraMillis);
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

    /**
     * INCR primero y comparar después: es la única forma de que dos peticiones simultáneas del
     * mismo dispositivo no lean ambas el mismo conteo. El EXPIRE se pone solo en el primer INCR,
     * asi la ventana es fija desde el primer reporte y no se renueva con cada intento — si se
     * renovara, un dispositivo que insiste sin parar nunca recuperaria su cupo.
     */
    @Override
    public boolean intentarReservarCupo(SectorId sectorId, HuellaDispositivo huella, int limite, Duration ventana) {
        String clave = claveDeCupo(sectorId, huella);

        Long usados = redis.opsForValue().increment(clave);
        if (usados == null) {
            // Redis caido: no se bloquea a un vecino por un problema de infraestructura ajeno a el
            // (mismo criterio que RateLimitingInterceptor). El limite deja de aplicarse mientras
            // tanto, que es preferible a rechazar reportes reales durante un corte.
            return true;
        }
        if (usados == 1L) {
            redis.expire(clave, ventana);
        }
        return usados <= limite;
    }

    private static String clave(SectorId sectorId) {
        return "consenso:sector:" + sectorId.valor();
    }

    /** Separada de la del consenso: son dos controles distintos y mezclarlos haria que cambiar uno
     * rompiera el otro sin avisar (ver el javadoc de esta clase). */
    private static String claveDeCupo(SectorId sectorId, HuellaDispositivo huella) {
        return "cupo:" + sectorId.valor() + ":" + huella.hash();
    }
}
