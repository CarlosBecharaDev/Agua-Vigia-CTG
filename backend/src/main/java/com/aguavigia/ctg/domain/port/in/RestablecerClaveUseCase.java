package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;

public interface RestablecerClaveUseCase {

    /**
     * Nunca falla ni distingue si el correo existe: siempre responde igual. Un formulario de
     * "olvidé mi clave" que dice "ese correo no está registrado" es un buscador de cuentas.
     */
    void solicitar(CorreoElectronico correo, ContextoDeAccion contexto);

    /** Cambiar la clave revoca todas las sesiones vivas: si alguien entró, deja de estar dentro. */
    void restablecer(String tokenEnClaro, ClaveEnClaro claveNueva, ContextoDeAccion contexto);
}
