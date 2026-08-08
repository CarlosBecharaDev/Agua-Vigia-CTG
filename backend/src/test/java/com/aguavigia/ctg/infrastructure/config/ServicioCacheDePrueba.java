package com.aguavigia.ctg.infrastructure.config;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/** Solo para CacheConfigTest — no hay servicios reales que cachear todavia en esta rama. */
@Service
public class ServicioCacheDePrueba {

    private final AtomicInteger invocaciones = new AtomicInteger();

    /** Metodo, no campo publico: leer el campo directo en el proxy CGLIB de @Cacheable devuelve
     * la copia sin inicializar del propio proxy, no el estado real del objeto delegado. */
    public int invocaciones() {
        return invocaciones.get();
    }

    public void reiniciarInvocaciones() {
        invocaciones.set(0);
    }

    @Cacheable("prueba-default")
    public String operacionConTtlPorDefecto(String clave) {
        invocaciones.incrementAndGet();
        return "valor-" + clave;
    }

    @Cacheable("prueba-corta")
    public String operacionConTtlCorto(String clave) {
        invocaciones.incrementAndGet();
        return "valor-" + clave;
    }
}
