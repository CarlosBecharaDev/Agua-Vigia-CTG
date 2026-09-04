package com.aguavigia.ctg.infrastructure.persistence.redis;

import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Una clave por cuenta con el instante desde el que sus tokens dejan de valer. No es una lista
 * negra: revocar cuesta una escritura y alcanza a todas las sesiones de esa persona a la vez, sin
 * que haga falta conocer los tokens emitidos.
 *
 * **Este adaptador falla cerrado**, al revés que RedisContadorReportesAdapter. Si Redis no
 * responde no se puede saber si una sesión sigue siendo válida, y dar por buena la duda
 * significaría que una cuenta suspendida vuelve a entrar justo durante una caída. Lo que se pierde
 * a cambio es acotado: solo afecta a las rutas del panel, porque el resto de la plataforma es
 * pública y su filtro ni siquiera consulta esto.
 */
@Component
public class RedisRevocacionSesionAdapter implements RevocacionSesionPort {

    /**
     * Por encima del máximo de vida de un token (8 horas, RNF011). Con menos, la marca caducaría
     * antes que los tokens que debía invalidar y la revocación se desharía sola.
     */
    private static final Duration RETENCION = Duration.ofHours(9);

    private static final String PREFIJO = "sesion:revocada:";

    private final RedisTemplate<String, String> redis;

    public RedisRevocacionSesionAdapter(@Qualifier("redisTemplate") RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    @Override
    public void revocarSesionesAnterioresA(UsuarioId usuarioId, Instant momento) {
        redis.opsForValue().set(clave(usuarioId), String.valueOf(momento.toEpochMilli()), RETENCION);
    }

    @Override
    public Optional<Instant> revocadasAntesDe(UsuarioId usuarioId) {
        try {
            String valor = redis.opsForValue().get(clave(usuarioId));
            return valor == null ? Optional.empty() : Optional.of(Instant.ofEpochMilli(Long.parseLong(valor)));
        } catch (DataAccessException | NumberFormatException noSePuedeVerificar) {
            throw new IllegalStateException(
                    "No se pudo verificar el estado de la sesión contra Redis", noSePuedeVerificar);
        }
    }

    private static String clave(UsuarioId usuarioId) {
        return PREFIJO + usuarioId.valor();
    }
}
