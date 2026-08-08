package com.aguavigia.ctg.infrastructure.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class JwtProviderTest {

    private static final String SECRETO_VALIDO = "01234567890123456789012345678901"; // 33 bytes

    @Test
    void debeValidarUnTokenQueElMismoEmitio() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO);

        String token = provider.emitirParaVeedor();

        assertThat(provider.validarYObtenerSujeto(token)).contains("veedor");
    }

    @Test
    void debeRechazarUnTokenFirmadoConOtraClave() {
        JwtProvider emisor = new JwtProvider(SECRETO_VALIDO);
        JwtProvider verificador = new JwtProvider("otra-clave-completamente-distinta-32b");

        String token = emisor.emitirParaVeedor();

        assertThat(verificador.validarYObtenerSujeto(token)).isEmpty();
    }

    @Test
    void debeRechazarUnTokenMalformadoSinLanzar() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO);

        assertThat(provider.validarYObtenerSujeto("esto-no-es-un-jwt")).isEmpty();
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEstaVacio() {
        JwtProvider provider = new JwtProvider("");

        assertThatIllegalStateException().isThrownBy(provider::emitirParaVeedor);
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEsMasCortoQue32Bytes() {
        JwtProvider provider = new JwtProvider("muy-corto");

        assertThatIllegalStateException().isThrownBy(provider::emitirParaVeedor);
    }

    @Test
    void validarNoDebeLanzarAunqueElSecretoEsteMalConfigurado() {
        JwtProvider provider = new JwtProvider("");

        // Un JWT_SECRET mal configurado no debe convertir "token invalido" en un 500 crudo.
        assertThat(provider.validarYObtenerSujeto("cualquier-token")).isEmpty();
    }
}
