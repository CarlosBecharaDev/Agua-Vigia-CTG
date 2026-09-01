package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;

/**
 * Igual que EventoBitacoraRepository: solo anexar y leer. Que no exista `editar` ni `eliminar` es
 * precisamente lo que hace que la auditoría valga como evidencia.
 */
public interface AuditoriaRepository {

    EventoAuditoria registrar(EventoAuditoria evento);

    Pagina<EventoAuditoria> listar(int pagina, int tamano);
}
