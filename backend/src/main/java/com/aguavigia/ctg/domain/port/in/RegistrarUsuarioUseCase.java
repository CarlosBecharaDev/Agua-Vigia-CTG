package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;

/**
 * Alta abierta: cualquiera puede pedir cuenta. Registrarse no concede absolutamente nada — hace
 * falta verificar el correo y que un ADMIN apruebe (ver EstadoCuenta).
 */
public interface RegistrarUsuarioUseCase {

    /**
     * No devuelve el usuario ni indica si el correo ya existía: responder distinto según eso
     * convierte el registro en un buscador de cuentas ajenas. Quien ya tiene cuenta recibe un
     * correo avisándolo; quien no, el enlace de verificación.
     */
    void registrar(CorreoElectronico correo, String nombre, ClaveEnClaro clave, ContextoDeAccion contexto);
}
