package com.aguavigia.ctg.infrastructure;

import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

/**
 * Adaptador de RelojPort. El Clock se inyecta para que las pruebas puedan fijar el instante
 * con Clock.fixed(...) sin tocar el reloj real de la maquina.
 */
@Component
public class RelojDelSistema implements RelojPort {

    private final Clock clock;

    public RelojDelSistema(Clock clock) {
        this.clock = clock;
    }

    @Override
    public Instant ahora() {
        return Instant.now(clock);
    }
}
