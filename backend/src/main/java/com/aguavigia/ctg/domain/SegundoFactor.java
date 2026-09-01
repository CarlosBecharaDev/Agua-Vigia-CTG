package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * El secreto se genera al empezar el alta, pero no protege nada hasta que la persona demuestra
 * que su app ya lo tiene escaneando y enviando un código válido. Hasta entonces `confirmadoEn` es
 * nulo y el login no lo exige: si lo exigiera antes, un alta a medias dejaría la cuenta inaccesible.
 */
public record SegundoFactor(SecretoTotp secreto, Instant confirmadoEn) {

    public SegundoFactor {
        if (secreto == null) {
            throw new IllegalArgumentException("El segundo factor debe tener un secreto");
        }
    }

    public static SegundoFactor sinConfirmar(SecretoTotp secreto) {
        return new SegundoFactor(secreto, null);
    }

    public boolean estaConfirmado() {
        return confirmadoEn != null;
    }

    public SegundoFactor confirmar(Instant momento) {
        if (momento == null) {
            throw new IllegalArgumentException("La confirmación del segundo factor necesita un instante");
        }
        return new SegundoFactor(secreto, momento);
    }
}
