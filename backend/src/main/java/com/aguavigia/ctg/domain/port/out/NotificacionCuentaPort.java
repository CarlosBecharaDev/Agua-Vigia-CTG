package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.Usuario;

/**
 * Los cuatro correos del ciclo de vida de una cuenta. Va aparte de NotificacionPort (avisos de
 * corte a la ciudadanía) porque son dos audiencias sin nada en común: mezclarlos obligaría a que
 * cualquier cambio en las alertas del mapa tocase la clase que manda enlaces de restablecimiento.
 *
 * El token en claro se pasa como argumento y no se toma del Usuario: no está guardado en ninguna
 * parte, solo existe entre que se genera y que sale en el correo.
 */
public interface NotificacionCuentaPort {

    void enviarVerificacionDeCorreo(Usuario usuario, String tokenEnClaro);

    void enviarInvitacion(Usuario invitado, Usuario autorDeLaInvitacion, String tokenEnClaro);

    void enviarEnlaceDeRestablecimiento(Usuario usuario, String tokenEnClaro);

    /** Se manda tras aprobar, rechazar, suspender o reactivar: nadie debe enterarse entrando. */
    void avisarCambioDeAcceso(Usuario usuario, String asunto, String mensaje);
}
