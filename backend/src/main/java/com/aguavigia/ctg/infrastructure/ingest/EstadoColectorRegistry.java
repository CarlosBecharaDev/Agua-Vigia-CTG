package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RNF007 — estado de salud de cada colector, en memoria.
 *
 * En memoria y no en Mongo a propósito: es telemetría operativa de *este* proceso, no un dato del
 * acueducto que haya que conservar. Un reinicio la borra y eso está bien — lo que importa es si la
 * ingesta está funcionando ahora. La consecuencia es que con más de una réplica cada una reporta la
 * suya; el despliegue del proyecto es de instancia única (Anexo 5).
 */
@Component
public class EstadoColectorRegistry {

    /**
     * Un colector que lleva esto o más ciclos seguidos fallando se reporta caído. Tres, y no uno,
     * porque el ciclo corre cada 10 minutos y un 502 suelto de un sitio de terceros no es una
     * degradación del servicio — es martes.
     */
    static final int FALLOS_PARA_REPORTARSE_CAIDO = 3;

    private final Map<String, EstadoColector> porNombre = new ConcurrentHashMap<>();
    private final RelojPort reloj;

    public EstadoColectorRegistry(RelojPort reloj) {
        this.reloj = reloj;
    }

    public void registrarExito(String colector, int itemsObtenidos) {
        porNombre.compute(colector, (nombre, estado) ->
                (estado == null ? EstadoColector.inicial(nombre) : estado)
                        .conExito(reloj.ahora(), itemsObtenidos));
    }

    public void registrarFallo(String colector, String motivo) {
        porNombre.compute(colector, (nombre, estado) ->
                (estado == null ? EstadoColector.inicial(nombre) : estado)
                        .conFallo(reloj.ahora(), motivo));
    }

    public List<EstadoColector> estados() {
        return porNombre.values().stream()
                .sorted((uno, otro) -> uno.nombre().compareTo(otro.nombre()))
                .toList();
    }

    /** Un colector que nunca ha corrido no está caído: está sin estrenar. */
    public boolean hayAlgunColectorCaido() {
        return porNombre.values().stream()
                .anyMatch(estado -> estado.fallosConsecutivos() >= FALLOS_PARA_REPORTARSE_CAIDO);
    }
}
