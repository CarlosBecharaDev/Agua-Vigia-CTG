package com.aguavigia.ctg.infrastructure.ingest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Forma normalizada a la que convergen todos los colectores (pipeline-ingesta-datos.md §3, etapa
 * 1). No es una entidad de dominio: vive en infrastructure/ porque su forma la define el pipeline
 * de ingesta, no una regla del negocio del acueducto.
 *
 * hash = SHA-256(titulo + texto), normalizado a mayusculas y sin espacios repetidos, para que el
 * mismo boletin republicado con formato ligeramente distinto en dos fuentes deduplique igual.
 */
public record DocumentoCrudo(
        String fuente,
        String urlOriginal,
        Instant publicadoEn,
        String titulo,
        String texto,
        String hash) {

    public DocumentoCrudo {
        if (fuente == null || fuente.isBlank()) {
            throw new IllegalArgumentException("El documento crudo debe declarar su fuente");
        }
        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("El documento crudo debe tener texto");
        }
    }

    public static DocumentoCrudo de(String fuente, String urlOriginal, Instant publicadoEn,
                                     String titulo, String texto) {
        return new DocumentoCrudo(fuente, urlOriginal, publicadoEn, titulo, texto,
                calcularHash(titulo, texto));
    }

    private static String calcularHash(String titulo, String texto) {
        String normalizado = normalizar((titulo == null ? "" : titulo) + " " + texto);
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] digest = sha256.digest(normalizado.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException imposibleEnJvmEstandar) {
            // SHA-256 es obligatorio en toda implementacion de Java (JLS, MessageDigest).
            throw new IllegalStateException(imposibleEnJvmEstandar);
        }
    }

    private static String normalizar(String s) {
        return s.trim().toUpperCase().replaceAll("\\s+", " ");
    }
}
