package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;

import java.util.Optional;

public interface ConsultarCuentasUseCase {

    Pagina<Usuario> listar(EstadoCuenta filtroEstado, int pagina, int tamano);

    Optional<Usuario> buscar(UsuarioId id);

    Pagina<EventoAuditoria> auditoria(int pagina, int tamano);
}
