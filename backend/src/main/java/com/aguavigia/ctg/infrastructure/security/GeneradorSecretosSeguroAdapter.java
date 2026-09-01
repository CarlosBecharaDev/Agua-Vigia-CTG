package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.port.out.GeneradorSecretosPort;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * SecureRandom y no Random: el segundo es un generador lineal predecible desde unas pocas salidas,
 * y estos valores son la única cosa que separa a un desconocido de una cuenta ajena.
 */
@Component
public class GeneradorSecretosSeguroAdapter implements GeneradorSecretosPort {

    /** 256 bits. Un token de enlace es tan bueno como su entropía; no hay motivo para escatimar. */
    private static final int BYTES_DE_TOKEN = 32;

    /** 160 bits, el tamaño que recomienda el RFC 4226 para HMAC-SHA1: 32 caracteres Base32. */
    private static final int BYTES_DE_SECRETO_TOTP = 20;

    private final SecureRandom aleatorio = new SecureRandom();

    @Override
    public String generarTokenDeEnlace() {
        byte[] bytes = new byte[BYTES_DE_TOKEN];
        aleatorio.nextBytes(bytes);
        // Sin relleno y seguro en URL: el token viaja como query param en el enlace del correo.
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * SHA-256 a secas y no BCrypt, al contrario que con las contraseñas. La razón es la entropía
     * de la entrada: una contraseña humana es adivinable y necesita un hash lento que encarezca
     * cada intento; estos 256 bits aleatorios no se adivinan por fuerza bruta, así que lo único que
     * hace falta es que el valor guardado no sea reversible.
     */
    @Override
    public String hashDeTokenDeEnlace(String tokenEnClaro) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha256.digest(tokenEnClaro.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException imposibleEnCualquierJvm) {
            throw new IllegalStateException("SHA-256 no disponible", imposibleEnCualquierJvm);
        }
    }

    @Override
    public SecretoTotp generarSecretoTotp() {
        byte[] bytes = new byte[BYTES_DE_SECRETO_TOTP];
        aleatorio.nextBytes(bytes);
        return new SecretoTotp(Base32.codificar(bytes));
    }
}
