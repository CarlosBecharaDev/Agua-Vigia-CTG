package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.Pagina;

/**
 * RF026-RF028 — solo anexar y leer. La ausencia de `editar` y `eliminar` es lo que hace cumplir la
 * inmutabilidad de RF028: no hay manera de romperla desde la aplicación aunque se quisiera.
 */
public interface EventoBitacoraRepository {

    EventoBitacora guardar(EventoBitacora evento);

    /**
     * Paginado y no completo: la bitácora es de solo anexado, así que crece monotónicamente y nunca
     * se poda. Traerla entera materializaba toda la colección en memoria en cada consulta.
     */
    Pagina<EventoBitacora> listar(int pagina, int tamano);
}
