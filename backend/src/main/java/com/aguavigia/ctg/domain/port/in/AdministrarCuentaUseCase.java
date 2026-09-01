package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;

/**
 * Las cinco acciones del ADMIN sobre una cuenta ajena. Van juntas y no en cinco servicios porque
 * comparten exactamente las mismas guardas —cargar autor y sujeto, prohibir actuar sobre uno mismo,
 * proteger al último administrador, auditar, revocar sesiones—, y repartirlas sería copiar esas
 * guardas cinco veces, que es como una de ellas acaba faltando en un sitio.
 */
public interface AdministrarCuentaUseCase {

    Usuario aprobar(UsuarioId sujeto, PermisosEfectivos permisos, ContextoDeAccion contexto);

    Usuario rechazar(UsuarioId sujeto, ContextoDeAccion contexto);

    Usuario suspender(UsuarioId sujeto, ContextoDeAccion contexto);

    Usuario reactivar(UsuarioId sujeto, ContextoDeAccion contexto);

    Usuario cambiarPermisos(UsuarioId sujeto, PermisosEfectivos permisos, ContextoDeAccion contexto);
}
