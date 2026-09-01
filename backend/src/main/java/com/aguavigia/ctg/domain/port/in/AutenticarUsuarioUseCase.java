package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SesionEmitida;

public interface AutenticarUsuarioUseCase {

    /** `codigoTotp` nulo si la cuenta no tiene segundo factor o si todavía no se ha pedido. */
    SesionEmitida autenticar(CorreoElectronico correo, String claveEnClaro, String codigoTotp,
                             ContextoDeAccion contexto);
}
