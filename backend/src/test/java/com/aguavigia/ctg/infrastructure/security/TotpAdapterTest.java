package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Se valida contra los vectores de prueba del propio RFC 6238 (apéndice B, modo SHA-1), no contra
 * lo que este código produzca. Es la diferencia entre comprobar que el algoritmo es el estándar y
 * comprobar que es consistente consigo mismo: lo segundo pasaría igual con una implementación mal
 * hecha, y la app de autenticación del usuario no la aceptaría.
 *
 * La semilla del RFC es el ASCII "12345678901234567890"; en Base32, GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ.
 */
class TotpAdapterTest {

    private static final SecretoTotp SEMILLA_DEL_RFC =
            new SecretoTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");

    private static TotpAdapter enElSegundo(long epochSegundos) {
        RelojPort reloj = () -> Instant.ofEpochSecond(epochSegundos);
        return new TotpAdapter(reloj, "AguaVigia CTG");
    }

    @Test
    void laSemillaDelRfcDebeCodificarseComoDiceElRfc() {
        assertThat(Base32.codificar("12345678901234567890".getBytes(StandardCharsets.US_ASCII)))
                .isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    }

    @Test
    void debeAceptarElCodigoDelRfcEnElSegundo59() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, "287082")).isTrue();
    }

    @Test
    void debeAceptarElCodigoDelRfcEnElSegundo1111111109() {
        assertThat(enElSegundo(1111111109L).codigoEsValido(SEMILLA_DEL_RFC, "081804")).isTrue();
    }

    @Test
    void debeAceptarElCodigoDelRfcEnElSegundo1234567890() {
        assertThat(enElSegundo(1234567890L).codigoEsValido(SEMILLA_DEL_RFC, "005924")).isTrue();
    }

    @Test
    void debeRechazarUnCodigoQueNoCorresponde() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, "000000")).isFalse();
    }

    /**
     * El reloj del teléfono y el del servidor nunca coinciden al milisegundo. Sin este margen, un
     * código tecleado en el segundo 29 de su franja se rechaza sin que nadie haya hecho nada mal.
     */
    @Test
    void debeAceptarElCodigoDeLaFranjaAnterior() {
        // 287082 pertenece a la franja del segundo 59; a los 60 segundos ya es la franja siguiente.
        assertThat(enElSegundo(60).codigoEsValido(SEMILLA_DEL_RFC, "287082")).isTrue();
    }

    /** La tolerancia va solo hacia atrás: aceptar códigos futuros alargaría su vida sin motivo. */
    @Test
    void noDebeAceptarElCodigoDeLaFranjaSiguiente() {
        assertThat(enElSegundo(29).codigoEsValido(SEMILLA_DEL_RFC, "081804")).isFalse();
    }

    @Test
    void debeCaducarPasadasDosFranjas() {
        assertThat(enElSegundo(120).codigoEsValido(SEMILLA_DEL_RFC, "287082")).isFalse();
    }

    @Test
    void debeRechazarUnCodigoConLongitudEquivocadaSinLanzar() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, "28708")).isFalse();
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, "2870822")).isFalse();
    }

    @Test
    void debeRechazarUnCodigoQueNoSeaNumericoSinLanzar() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, "abcdef")).isFalse();
    }

    @Test
    void debeRechazarUnCodigoNuloSinLanzar() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, null)).isFalse();
    }

    /** Las apps muestran el código en dos grupos de tres; pegarlo trae el espacio de en medio. */
    @Test
    void debeTolerarLosEspaciosQueVienenAlPegarElCodigo() {
        assertThat(enElSegundo(59).codigoEsValido(SEMILLA_DEL_RFC, " 287 082 ")).isTrue();
    }

    @Test
    void laUriDeAltaDebeLlevarSecretoEmisorYParametros() {
        String uri = enElSegundo(59).uriDeAlta(SEMILLA_DEL_RFC, new CorreoElectronico("ana@ejemplo.org"));

        assertThat(uri)
                .startsWith("otpauth://totp/")
                .contains("secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ")
                .contains("issuer=AguaVigia+CTG")
                .contains("digits=6")
                .contains("period=30");
    }

    @Test
    void laUriDebeEscaparElCorreoParaNoRomperLaEtiqueta() {
        String uri = enElSegundo(59).uriDeAlta(SEMILLA_DEL_RFC, new CorreoElectronico("ana@ejemplo.org"));

        assertThat(uri).contains("ana%40ejemplo.org");
    }

    @Test
    void base32DebeIdaYVueltaSinPerderBytes() {
        byte[] original = "veinte-bytes-exact.".getBytes(StandardCharsets.US_ASCII);

        assertThat(Base32.decodificar(Base32.codificar(original))).startsWith(original);
    }
}
