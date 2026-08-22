package com.aguavigia.ctg.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class JwtProviderTest {

    private static final com.aguavigia.ctg.domain.port.out.RelojPort RELOJ =
            () -> java.time.Instant.parse("2026-08-09T20:00:00Z");

    private static final String SECRETO_VALIDO = "01234567890123456789012345678901"; // 33 bytes

    @Test
    void debeValidarUnTokenQueElMismoEmitio() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);

        String token = provider.emitirParaVeedor();

        assertThat(provider.validarYObtenerSujeto(token)).contains("veedor");
    }

    @Test
    void debeRechazarUnTokenFirmadoConOtraClave() {
        JwtProvider emisor = new JwtProvider(SECRETO_VALIDO, RELOJ);
        JwtProvider verificador = new JwtProvider("otra-clave-completamente-distinta-32b", RELOJ);

        String token = emisor.emitirParaVeedor();

        assertThat(verificador.validarYObtenerSujeto(token)).isEmpty();
    }

    @Test
    void debeRechazarUnTokenMalformadoSinLanzar() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);

        assertThat(provider.validarYObtenerSujeto("esto-no-es-un-jwt")).isEmpty();
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEstaVacio() {
        JwtProvider provider = new JwtProvider("", RELOJ);

        assertThatIllegalStateException().isThrownBy(provider::emitirParaVeedor);
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEsMasCortoQue32Bytes() {
        JwtProvider provider = new JwtProvider("muy-corto", RELOJ);

        assertThatIllegalStateException().isThrownBy(provider::emitirParaVeedor);
    }

    @Test
    void validarNoDebeLanzarAunqueElSecretoEsteMalConfigurado() {
        JwtProvider provider = new JwtProvider("", RELOJ);

        // Un JWT_SECRET mal configurado no debe convertir "token invalido" en un 500 crudo.
        assertThat(provider.validarYObtenerSujeto("cualquier-token")).isEmpty();
    }
}
