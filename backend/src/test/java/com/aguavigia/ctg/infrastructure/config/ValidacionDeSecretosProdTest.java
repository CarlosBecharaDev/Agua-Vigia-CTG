package com.aguavigia.ctg.infrastructure.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * En dev los secretos vacíos son deliberados y están documentados. En producción dejaban arrancar
 * un despliegue que se veía sano y donde el panel del veedor respondía 503 en silencio.
 */
class ValidacionDeSecretosProdTest {

    private static final String SECRETO_VALIDO = "un-secreto-de-al-menos-32-bytes-para-hs256";
    private static final String HASH_VALIDO = "$2a$10$abcdefghijklmnopqrstuv";

    private void validar(String jwt, String hashVeedor, String iot) {
        new ValidacionDeSecretosProd(jwt, hashVeedor, iot).validar();
    }

    @Test
    void debeArrancarCuandoLosSecretosEstanCompletos() {
        assertThatCode(() -> validar(SECRETO_VALIDO, HASH_VALIDO, "clave-iot")).doesNotThrowAnyException();
    }

    @Test
    void debeAbortarSiFaltaElSecretoJwt() {
        assertThatThrownBy(() -> validar("", HASH_VALIDO, "clave-iot"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    /** HS256 lo exige; es la misma cota que aplica JwtProvider al usarse. */
    @Test
    void debeAbortarSiElSecretoJwtEsMasCortoDeLoQueExigeHs256() {
        assertThatThrownBy(() -> validar("corto", HASH_VALIDO, "clave-iot"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void debeAbortarSiFaltaElHashDelVeedor() {
        assertThatThrownBy(() -> validar(SECRETO_VALIDO, "  ", "clave-iot"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("VEEDOR_PASSWORD_HASH");
    }

    @Test
    void debeReportarTodoLoQueFaltaDeUnaVezYNoDeUnoEnUno() {
        assertThatThrownBy(() -> validar("", "", ""))
                .isInstanceOf(IllegalStateException.class)
                .satisfies(fallo -> assertThat(fallo.getMessage())
                        .contains("JWT_SECRET")
                        .contains("VEEDOR_PASSWORD_HASH"));
    }

    /** M13 es opcional: el endpoint ya responde 503 por su cuenta mientras no esté configurado. */
    @Test
    void laClaveIotFaltanteNoDebeImpedirElArranque() {
        assertThatCode(() -> validar(SECRETO_VALIDO, HASH_VALIDO, "")).doesNotThrowAnyException();
    }
}
