package com.aguavigia.ctg.infrastructure.persistence.redis;

import com.aguavigia.ctg.domain.port.out.ControlIntentosPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Contador de fallos y bloqueo por cuenta, con la ventana fija desde el primer fallo: el EXPIRE se
 * pone solo en el primer INCR. Si se renovara en cada intento, quien insiste sin parar nunca
 * dejaría que el contador venza y el bloqueo sería permanente.
 *
 * **Falla abierto** cuando Redis no responde, igual que RedisContadorReportesAdapter y el
 * limitador por IP de ADR-018. Perder el bloqueo deja la cuenta protegida por su contraseña, que
 * es su defensa normal; fallar cerrado dejaría a todo el equipo sin poder entrar por una caída de
 * la caché. La revocación de sesiones sí falla cerrado, y su adaptador explica por qué difiere.
 *
 * El correo no se guarda en claro: la clave lleva su SHA-256. Redis suele ser el componente con
 * menos controles de acceso del despliegue, y no hay razón para que tenga dentro la lista de
 * direcciones contra las que alguien está intentando entrar.
 */
@Component
public class RedisControlIntentosAdapter implements ControlIntentosPort {

    private static final Logger log = LoggerFactory.getLogger(RedisControlIntentosAdapter.class);

    private static final String PREFIJO_FALLOS = "login:fallos:";
    private static final String PREFIJO_BLOQUEO = "login:bloqueo:";
    private static final String PREFIJO_UNICO = "unico:";

    private final RedisTemplate<String, String> redis;

    public RedisControlIntentosAdapter(@Qualifier("redisTemplate") RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    @Override
    public void registrarFallo(String correoNormalizado, Duration ventana, int maximoIntentos, Duration bloqueo) {
        String huella = huella(correoNormalizado);
        try {
            Long fallos = redis.opsForValue().increment(PREFIJO_FALLOS + huella);
            if (fallos == null) {
                return;
            }
            if (fallos == 1L) {
                redis.expire(PREFIJO_FALLOS + huella, ventana);
            }
            if (fallos >= maximoIntentos) {
                redis.opsForValue().set(PREFIJO_BLOQUEO + huella, "1", bloqueo);
                redis.delete(PREFIJO_FALLOS + huella);
            }
        } catch (DataAccessException redisCaido) {
            log.warn("No se pudo registrar el intento fallido de acceso: {}", redisCaido.getMessage());
        }
    }

    @Override
    public Optional<Duration> bloqueoVigente(String correoNormalizado) {
        try {
            Long segundos = redis.getExpire(PREFIJO_BLOQUEO + huella(correoNormalizado), TimeUnit.SECONDS);
            // -2 = la clave no existe; -1 = existe sin TTL. Ninguno de los dos es un bloqueo vivo.
            return segundos == null || segundos <= 0
                    ? Optional.empty()
                    : Optional.of(Duration.ofSeconds(segundos));
        } catch (DataAccessException redisCaido) {
            log.warn("No se pudo consultar el bloqueo de la cuenta: {}", redisCaido.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void limpiarIntentos(String correoNormalizado) {
        String huella = huella(correoNormalizado);
        try {
            redis.delete(PREFIJO_FALLOS + huella);
            redis.delete(PREFIJO_BLOQUEO + huella);
        } catch (DataAccessException redisCaido) {
            log.warn("No se pudieron limpiar los intentos fallidos: {}", redisCaido.getMessage());
        }
    }

    /**
     * SETNX: la comprobación y la escritura son una sola operación atómica en Redis. Con un GET
     * seguido de un SET, dos reenvíos simultáneos del mismo código pasarían los dos.
     */
    @Override
    public boolean consumirPorPrimeraVez(String clave, Duration ventana) {
        try {
            Boolean primeraVez = redis.opsForValue()
                    .setIfAbsent(PREFIJO_UNICO + huella(clave), "1", ventana);
            return primeraVez == null || primeraVez;
        } catch (DataAccessException redisCaido) {
            log.warn("No se pudo comprobar el uso único de un código: {}", redisCaido.getMessage());
            return true;
        }
    }

    private static String huella(String valor) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha256.digest(valor.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException imposibleEnCualquierJvm) {
            throw new IllegalStateException("SHA-256 no disponible", imposibleEnCualquierJvm);
        }
    }
}
