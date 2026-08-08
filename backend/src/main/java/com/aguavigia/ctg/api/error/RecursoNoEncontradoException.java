package com.aguavigia.ctg.api.error;

/**
 * El recurso pedido por la URL no existe. Vive en api/ y no en domain/: "404" es un concepto
 * de HTTP, no del acueducto de Cartagena.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
