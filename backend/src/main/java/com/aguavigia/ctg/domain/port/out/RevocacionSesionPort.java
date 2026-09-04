package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.UsuarioId;

import java.time.Instant;
import java.util.Optional;

/**
 * Un JWT firmado es válido hasta que caduca, y RNF011 permite que eso sea hasta 8 horas. Sin este
 * puerto, suspender a alguien o quitarle un permiso no surtiría efecto hasta 8 horas después —
 * justo en el escenario en el que la prisa importa.
 *
 * No es una lista negra de tokens: se guarda un instante por cuenta, y todo token emitido antes de
 * él deja de valer. Una sola escritura revoca todas las sesiones de esa persona, esté donde esté.
 */
public interface RevocacionSesionPort {

    void revocarSesionesAnterioresA(UsuarioId usuarioId, Instant momento);

    Optional<Instant> revocadasAntesDe(UsuarioId usuarioId);
}
