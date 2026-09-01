package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.Usuario;

public interface VerificarCorreoUseCase {

    Usuario verificar(String tokenEnClaro, ContextoDeAccion contexto);
}
