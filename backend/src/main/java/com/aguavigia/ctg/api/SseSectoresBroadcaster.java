package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.RespuestaSectores;
import com.aguavigia.ctg.api.mapper.SectorApiMapper;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * estado-del-backend.md #6.1 — "SSE de una sola instancia": `emitters` vivía en SectorController y
 * se difundía directo al recibir SectorActualizadoEvent, así que con más de una réplica solo se
 * enteraban los clientes conectados a la instancia que procesó el cambio.
 *
 * Ahora la actualización se publica en el canal Redis {@link #CANAL} y CADA instancia suscrita
 * —incluida la que escribió— reconsulta el estado (listarTodos() ya cacheado 15s,
 * CacheConfig/application.yml) y empuja a sus propios clientes locales. Ninguna instancia depende
 * de deserializar el estado de otra: cada una lee la misma fuente de verdad (Mongo).
 */
@Component
public class SseSectoresBroadcaster implements MessageListener {

    static final String CANAL = "aguavigia:sse:sectores";

    private final SectorRepository sectores;
    private final SectorApiMapper mapper;
    private final RelojPort reloj;
    private final RedisTemplate<String, String> redisTemplate;
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseSectoresBroadcaster(SectorRepository sectores, SectorApiMapper mapper, RelojPort reloj,
                                   RedisTemplate<String, String> redisTemplate) {
        this.sectores = sectores;
        this.mapper = mapper;
        this.reloj = reloj;
        this.redisTemplate = redisTemplate;
    }

    public SseEmitter registrar() {
        SseEmitter emitter = new SseEmitter(600_000L); // 10 minutos
        emitters.add(emitter);

        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event().name("sectores").data(estadoActual()));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    /**
     * Publica en Redis en vez de difundir directo a `emitters`: así todas las instancias
     * suscritas se enteran, no solo la que procesó el cambio. El payload no lleva el estado en sí
     * —cada instancia lo reconsulta— para no depender de que todas compartan el mismo serializador.
     */
    public void notificarActualizacion() {
        redisTemplate.convertAndSend(CANAL, reloj.ahora().toString());
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        RespuestaSectores respuesta = estadoActual();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("sectores").data(respuesta));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    private RespuestaSectores estadoActual() {
        return new RespuestaSectores(mapper.aRespuestas(sectores.listarTodos()), reloj.ahora());
    }
}
