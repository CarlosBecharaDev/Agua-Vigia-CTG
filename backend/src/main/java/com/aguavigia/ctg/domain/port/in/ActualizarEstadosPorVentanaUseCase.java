package com.aguavigia.ctg.domain.port.in;

/**
 * M9 — mueve el estado de los sectores cuando la ventana que la fuente prometió empieza o termina.
 *
 * Sin esto, un corte anunciado para mañana y aprobado hoy se quedaba en CORTE_PROGRAMADO para
 * siempre: nadie volvía a mirarlo. El barrio aparecía «con corte programado» semanas después de que
 * el agua hubiera vuelto.
 */
public interface ActualizarEstadosPorVentanaUseCase {

    /** @return cuántos sectores cambiaron de estado en este barrido. */
    int aplicarVentanasVencidas();
}
