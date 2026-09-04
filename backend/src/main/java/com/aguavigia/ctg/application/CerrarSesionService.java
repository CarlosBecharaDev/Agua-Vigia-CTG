package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.CerrarSesionUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import org.springframework.stereotype.Service;

/**
 * Revoca en el servidor, no solo en el navegador. Borrar el token del cliente deja el JWT firmado
 * y vivo: quien lo hubiera copiado seguiría dentro hasta que caduque.
 */
@Service
public class CerrarSesionService implements CerrarSesionUseCase {

    private final RevocacionSesionPort revocacion;
    private final RelojPort reloj;

    public CerrarSesionService(RevocacionSesionPort revocacion, RelojPort reloj) {
        this.revocacion = revocacion;
        this.reloj = reloj;
    }

    @Override
    public void cerrar(UsuarioId usuarioId) {
        revocacion.revocarSesionesAnterioresA(usuarioId, reloj.ahora());
    }
}
