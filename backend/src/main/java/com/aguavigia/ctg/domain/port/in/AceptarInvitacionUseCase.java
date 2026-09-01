package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.Usuario;

public interface AceptarInvitacionUseCase {

    Usuario aceptar(String tokenEnClaro, ClaveEnClaro clave, ContextoDeAccion contexto);
}
