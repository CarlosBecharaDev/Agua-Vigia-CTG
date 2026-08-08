package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.EventoBitacora;

import java.util.List;

public interface EventoBitacoraRepository {

    EventoBitacora guardar(EventoBitacora evento);

    List<EventoBitacora> listarTodos();
}
