package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import org.springframework.stereotype.Service;

/**
 * RF026 — anexa un evento a la bitácora. Sin regla de negocio propia: la inmutabilidad (RF028) la
 * impone la forma del puerto de salida (`guardar`/`listarTodos`, sin editar ni eliminar), no este
 * servicio.
 */
@Service
public class RegistrarEventoBitacoraService implements RegistrarEventoBitacoraUseCase {

    private final EventoBitacoraRepository eventos;

    public RegistrarEventoBitacoraService(EventoBitacoraRepository eventos) {
        this.eventos = eventos;
    }

    @Override
    public void registrar(EventoBitacora evento) {
        eventos.guardar(evento);
    }
}
