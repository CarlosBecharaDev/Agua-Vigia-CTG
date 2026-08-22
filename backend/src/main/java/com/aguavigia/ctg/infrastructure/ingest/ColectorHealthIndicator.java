package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * RNF007 — la salud de los colectores llega a `/actuator/health`.
 *
 * El nombre del bean (`colectores`) es la clave con la que aparece dentro del JSON de salud.
 *
 * Los detalles (última ejecución, ítems, tasa de error) solo se ven si `show-details` lo permite, y
 * en producción está en `never` a propósito: no hay por qué contarle a cualquiera cómo va la
 * ingesta. El detalle completo se sirve autenticado en `GET /api/veedor/ingesta/salud`. Aquí queda
 * lo que sí debe ser público: si el servicio está degradado o no.
 */
@Component("colectores")
public class ColectorHealthIndicator implements HealthIndicator {

    private final EstadoColectorRegistry registro;

    public ColectorHealthIndicator(EstadoColectorRegistry registro) {
        this.registro = registro;
    }

    @Override
    public Health health() {
        Health.Builder salud = registro.hayAlgunColectorCaido() ? Health.down() : Health.up();

        for (EstadoColector estado : registro.estados()) {
            salud.withDetail(estado.nombre(), java.util.Map.of(
                    "ultimaEjecucionExitosa", String.valueOf(estado.ultimaEjecucionExitosa()),
                    "itemsProcesados", estado.itemsProcesados(),
                    "tasaDeError", estado.tasaDeError(),
                    "fallosConsecutivos", estado.fallosConsecutivos()));
        }

        return salud.build();
    }
}
