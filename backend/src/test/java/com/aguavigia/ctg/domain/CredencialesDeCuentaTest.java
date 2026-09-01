package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

/**
 * Los objetos de valor que sostienen el acceso: la política de contraseña, el hash, el secreto TOTP
 * y los enlaces de un solo uso. Van juntos porque comparten una propiedad que se prueba igual en
 * todos — ninguno debe dejar rastro de su contenido en un log.
 */
class CredencialesDeCuentaTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final String HASH_VALIDO =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    @Test
    void debeAceptarUnaClaveQueCumpleLaPolitica() {
        assertThat(new ClaveEnClaro("clave-larga-y-variada").valor()).isNotBlank();
    }

    @Test
    void debeRechazarUnaClaveMasCortaDeLoExigido() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ClaveEnClaro("corta1"))
                .withMessageContaining("12");
    }

    /** BCrypt trunca en 72 bytes: sin este tope, dos claves largas distintas serían la misma. */
    @Test
    void debeRechazarUnaClaveQueBcryptTruncaria() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ClaveEnClaro("a1b2c3d4e5f6".repeat(7)));
    }

    @Test
    void debeRechazarUnaClaveQueRepiteSiempreLosMismosCaracteres() {
        assertThatIllegalArgumentException().isThrownBy(() -> new ClaveEnClaro("ababababababab"));
    }

    @Test
    void debeRechazarUnaClaveConEspaciosAlPrincipioOAlFinal() {
        assertThatIllegalArgumentException().isThrownBy(() -> new ClaveEnClaro(" clave-con-espacio"));
    }

    @Test
    void laClaveEnClaroNoDebeAparecerEnSuToString() {
        assertThat(new ClaveEnClaro("clave-larga-y-variada").toString())
                .doesNotContain("clave-larga-y-variada");
    }

    @Test
    void elHashNoDebeAparecerEnSuToString() {
        assertThat(new ClaveHash(HASH_VALIDO).toString()).doesNotContain(HASH_VALIDO);
    }

    /** La guarda que impide pasar por descuido la contraseña real donde se espera el hash. */
    @Test
    void debeRechazarUnHashQueNoTengaFormatoBcrypt() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ClaveHash("clave-en-texto-plano"))
                .withMessageContaining("BCrypt");
    }

    @Test
    void elSecretoTotpNoDebeAparecerEnSuToString() {
        assertThat(new SecretoTotp("GEZDGNBVGY3TQOJQ").toString()).doesNotContain("GEZDGNBVGY3TQOJQ");
    }

    @Test
    void debeRechazarUnSecretoTotpQueNoEsteEnBase32() {
        assertThatIllegalArgumentException().isThrownBy(() -> new SecretoTotp("secreto-con-minusculas"));
        assertThatIllegalArgumentException().isThrownBy(() -> new SecretoTotp("AAAAAAAA1AAAAAAA"));
    }

    @Test
    void debeRechazarUnSecretoTotpDemasiadoCorto() {
        assertThatIllegalArgumentException().isThrownBy(() -> new SecretoTotp("GEZDGNBV"));
    }

    @Test
    void cadaTipoDeTokenDebeVencerSegunSuRiesgo() {
        assertThat(TipoTokenCuenta.RESTABLECER_CLAVE.vigencia())
                .isLessThan(TipoTokenCuenta.VERIFICACION_CORREO.vigencia());
        assertThat(TipoTokenCuenta.VERIFICACION_CORREO.vigencia())
                .isLessThan(TipoTokenCuenta.INVITACION.vigencia());
    }

    @Test
    void unTokenReciennNacidoDebeEstarVigente() {
        TokenCuenta token = TokenCuenta.nuevo(
                "hash", TipoTokenCuenta.RESTABLECER_CLAVE, new UsuarioId("u-1"), AHORA);

        assertThat(token.estaVigente(AHORA.plusSeconds(60))).isTrue();
    }

    @Test
    void unTokenVencidoNoDebeEstarVigente() {
        TokenCuenta token = TokenCuenta.nuevo(
                "hash", TipoTokenCuenta.RESTABLECER_CLAVE, new UsuarioId("u-1"), AHORA);

        assertThat(token.estaVigente(AHORA.plusSeconds(31 * 60))).isFalse();
    }

    /** Sin esto, un enlace de restablecimiento reenviado sigue sirviendo hasta que caduque. */
    @Test
    void unTokenUsadoNoDebeVolverAEstarVigente() {
        TokenCuenta usado = TokenCuenta
                .nuevo("hash", TipoTokenCuenta.INVITACION, new UsuarioId("u-1"), AHORA)
                .marcarUsado(AHORA.plusSeconds(10));

        assertThat(usado.estaVigente(AHORA.plusSeconds(20))).isFalse();
    }

    @Test
    void debeRechazarQueSeUseDosVecesElMismoToken() {
        TokenCuenta usado = TokenCuenta
                .nuevo("hash", TipoTokenCuenta.INVITACION, new UsuarioId("u-1"), AHORA)
                .marcarUsado(AHORA);

        assertThatIllegalStateException().isThrownBy(() -> usado.marcarUsado(AHORA.plusSeconds(1)));
    }

    @Test
    void debeNormalizarElCorreoAMinusculasYSinEspacios() {
        assertThat(new CorreoElectronico(" Ana@Ejemplo.ORG ".strip()).normalizado().valor())
                .isEqualTo("ana@ejemplo.org");
    }
}
