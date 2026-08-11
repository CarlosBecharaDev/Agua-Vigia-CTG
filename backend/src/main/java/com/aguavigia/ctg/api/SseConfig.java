package com.aguavigia.ctg.api;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Backplane Redis de SseSectoresBroadcaster — sin este contenedor suscrito, cada instancia solo
 * recibiría los mensajes que ella misma publica en el mismo proceso (ninguno, en realidad, porque
 * convertAndSend no se entrega a sí mismo sin un listener registrado), y el problema de la SSE de
 * una sola instancia seguiría intacto.
 */
@Configuration
public class SseConfig {

    @Bean
    public RedisMessageListenerContainer contenedorDeSuscripcionSse(
            RedisConnectionFactory connectionFactory, SseSectoresBroadcaster broadcaster) {
        RedisMessageListenerContainer contenedor = new RedisMessageListenerContainer();
        contenedor.setConnectionFactory(connectionFactory);
        contenedor.addMessageListener(broadcaster, new ChannelTopic(SseSectoresBroadcaster.CANAL));
        return contenedor;
    }
}
