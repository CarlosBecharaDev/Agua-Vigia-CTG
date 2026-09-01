package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.port.out.CifradorClavePort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Reutiliza el PasswordEncoder que ya declara SecurityConfig, para que la clave del veedor y
 * cualquier clave nueva usen exactamente el mismo coste. Si fueran dos beans, subir el coste en
 * uno y no en el otro no lo notaría nadie hasta que hiciera falta.
 */
@Component
public class BCryptCifradorClaveAdapter implements CifradorClavePort {

    /**
     * Hash real de una clave que nadie conoce, generado con el mismo coste que usa el encoder. Se
     * compara contra él cuando el correo no existe para gastar el mismo tiempo que un intento
     * legítimo: ver el javadoc de gastarTiempoEquivalente en el puerto.
     */
    private static final String HASH_SENUELO =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final PasswordEncoder encoder;

    public BCryptCifradorClaveAdapter(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @Override
    public ClaveHash cifrar(String claveEnClaro) {
        return new ClaveHash(encoder.encode(claveEnClaro));
    }

    @Override
    public boolean coincide(String claveEnClaro, ClaveHash hash) {
        if (claveEnClaro == null || hash == null) {
            return false;
        }
        return encoder.matches(claveEnClaro, hash.valor());
    }

    @Override
    public void gastarTiempoEquivalente() {
        encoder.matches("clave-que-nunca-coincide", HASH_SENUELO);
    }
}
