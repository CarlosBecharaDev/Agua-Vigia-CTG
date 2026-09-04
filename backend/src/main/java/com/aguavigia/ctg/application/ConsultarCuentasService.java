package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import com.aguavigia.ctg.domain.port.out.AuditoriaRepository;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Lecturas del panel de administración. Paginadas por el mismo motivo que la bitácora (ver
 * {@code Pagina}): la auditoría es de solo anexado y crece sin cota.
 */
@Service
public class ConsultarCuentasService implements ConsultarCuentasUseCase {

    private final UsuarioRepository usuarios;
    private final AuditoriaRepository auditoria;

    public ConsultarCuentasService(UsuarioRepository usuarios, AuditoriaRepository auditoria) {
        this.usuarios = usuarios;
        this.auditoria = auditoria;
    }

    @Override
    public Pagina<Usuario> listar(EstadoCuenta filtroEstado, int pagina, int tamano) {
        return usuarios.listar(filtroEstado, Pagina.paginaValida(pagina), Pagina.tamanoValido(tamano));
    }

    @Override
    public Optional<Usuario> buscar(UsuarioId id) {
        return usuarios.buscarPorId(id);
    }

    @Override
    public Pagina<EventoAuditoria> auditoria(int pagina, int tamano) {
        return auditoria.listar(Pagina.paginaValida(pagina), Pagina.tamanoValido(tamano));
    }
}
