package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SegundoFactorPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;

/**
 * TOTP de RFC 6238 sobre HMAC-SHA1, 6 dígitos, franjas de 30 segundos: los parámetros por defecto
 * de Google Authenticator, Aegis, 1Password y demás. Implementado a mano y no con una librería por
 * el mismo criterio que Base32 — son cuarenta líneas de un estándar cerrado desde 2011.
 *
 * Se acepta también la franja inmediatamente anterior. No es laxitud: el reloj del teléfono y el
 * del servidor nunca coinciden al milisegundo, y sin ese margen un código tecleado en el segundo 29
 * se rechaza sin que nadie haya hecho nada mal.
 */
@Component
public class TotpAdapter implements SegundoFactorPort {

    private static final int DIGITOS = 6;
    private static final long SEGUNDOS_POR_FRANJA = 30L;
    private static final int FRANJAS_DE_TOLERANCIA = 1;
    private static final String ALGORITMO = "HmacSHA1";

    private final RelojPort reloj;
    private final String emisor;

    public TotpAdapter(RelojPort reloj,
                       @Value("${aguavigia.cuentas.emisor-totp:AguaVigia CTG}") String emisor) {
        this.reloj = reloj;
        this.emisor = emisor;
    }

    @Override
    public boolean codigoEsValido(SecretoTotp secreto, String codigo) {
        if (codigo == null) {
            return false;
        }
        String normalizado = codigo.replace(" ", "").strip();
        if (normalizado.length() != DIGITOS || !normalizado.chars().allMatch(Character::isDigit)) {
            return false;
        }

        long franjaActual = reloj.ahora().getEpochSecond() / SEGUNDOS_POR_FRANJA;
        byte[] clave = Base32.decodificar(secreto.valor());

        for (int desplazamiento = -FRANJAS_DE_TOLERANCIA; desplazamiento <= 0; desplazamiento++) {
            if (sonIguales(calcular(clave, franjaActual + desplazamiento), normalizado)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String uriDeAlta(SecretoTotp secreto, CorreoElectronico correo) {
        String etiqueta = codificar(emisor) + ":" + codificar(correo.valor());
        return "otpauth://totp/" + etiqueta
                + "?secret=" + secreto.valor()
                + "&issuer=" + codificar(emisor)
                + "&algorithm=SHA1&digits=" + DIGITOS + "&period=" + SEGUNDOS_POR_FRANJA;
    }

    private static String calcular(byte[] clave, long franja) {
        try {
            Mac mac = Mac.getInstance(ALGORITMO);
            mac.init(new SecretKeySpec(clave, ALGORITMO));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(Long.BYTES).putLong(franja).array());

            // Truncamiento dinámico del RFC: los 4 bits bajos del último byte eligen desde dónde
            // se leen los 4 bytes que forman el código.
            int desplazamiento = hash[hash.length - 1] & 0x0F;
            int binario = ((hash[desplazamiento] & 0x7F) << 24)
                    | ((hash[desplazamiento + 1] & 0xFF) << 16)
                    | ((hash[desplazamiento + 2] & 0xFF) << 8)
                    | (hash[desplazamiento + 3] & 0xFF);

            return String.format("%0" + DIGITOS + "d", binario % (int) Math.pow(10, DIGITOS));
        } catch (GeneralSecurityException noDeberiaPasar) {
            throw new IllegalStateException("No se pudo calcular el código TOTP", noDeberiaPasar);
        }
    }

    /**
     * Comparación de duración constante. Un `equals` de String se detiene en el primer carácter
     * distinto, y esa diferencia de tiempo permite adivinar el código dígito a dígito.
     */
    private static boolean sonIguales(String esperado, String recibido) {
        return MessageDigest.isEqual(
                esperado.getBytes(StandardCharsets.UTF_8),
                recibido.getBytes(StandardCharsets.UTF_8));
    }

    private static String codificar(String valor) {
        return URLEncoder.encode(valor, StandardCharsets.UTF_8);
    }
}
