package com.aguavigia.ctg.domain;

/**
 * Quién ejecuta una acción y desde dónde. Se pasa explícito por los casos de uso en vez de leerse
 * de un contexto de seguridad estático: `SecurityContextHolder` es de Spring, y la capa de
 * aplicación no puede tocarlo (Regla de Oro). El efecto secundario es bueno — cada caso de uso
 * declara en su firma que necesita saber quién actúa, y probarlo no exige montar seguridad.
 *
 * `autorId` nulo significa que no actúa una cuenta: el arranque del sistema, o alguien anónimo
 * registrándose.
 */
public record ContextoDeAccion(UsuarioId autorId, String ip) {

    public static ContextoDeAccion anonimo(String ip) {
        return new ContextoDeAccion(null, ip);
    }

    public static ContextoDeAccion delSistema() {
        return new ContextoDeAccion(null, "sistema");
    }
}
