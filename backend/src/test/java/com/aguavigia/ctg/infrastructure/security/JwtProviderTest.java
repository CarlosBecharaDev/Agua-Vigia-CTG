package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class JwtProviderTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final com.aguavigia.ctg.domain.port.out.RelojPort RELOJ = () -> AHORA;

    private static final String SECRETO_VALIDO = "01234567890123456789012345678901"; // 33 bytes

    private static Usuario veedor() {
        return new Usuario(
                new UsuarioId("u-1"),
                new CorreoElectronico("veedor@aguavigia.test"),
                "Veedor de prueba",
                new ClaveHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"),
                EstadoCuenta.ACTIVA,
                PermisosEfectivos.deRol(RolVeedor.VEEDOR),
                null,
                AHORA,
                AHORA);
    }

    @Test
    void debeValidarUnTokenQueElMismoEmitio() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);

        String token = provider.emitir(veedor(), AlcanceSesion.COMPLETO);

        assertThat(provider.validar(token)).hasValueSatisfying(sesion -> {
            assertThat(sesion.usuarioId()).isEqualTo("u-1");
            assertThat(sesion.correo()).isEqualTo("veedor@aguavigia.test");
            assertThat(sesion.rol()).isEqualTo("VEEDOR");
            assertThat(sesion.alcance()).isEqualTo(AlcanceSesion.COMPLETO);
        });
    }

    @Test
    void debeLlevarDentroLosPermisosEfectivosDelRol() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);

        String token = provider.emitir(veedor(), AlcanceSesion.COMPLETO);

        assertThat(provider.validar(token).orElseThrow().permisos())
                .containsExactlyInAnyOrderElementsOf(RolVeedor.VEEDOR.permisosBase());
    }

    /**
     * La garantía que sostiene el arranque del primer ADMIN: aunque su rol lo autorice a todo, un
     * token de este alcance no puede llevar más que el permiso de dar de alta el segundo factor.
     */
    @Test
    void unTokenDeAltaDeSegundoFactorNoDebeLlevarNingunOtroPermiso() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);
        Usuario admin = veedor().cambiarPermisos(PermisosEfectivos.deRol(RolVeedor.ADMIN), AHORA);

        String token = provider.emitir(admin, AlcanceSesion.ALTA_SEGUNDO_FACTOR);

        assertThat(provider.validar(token).orElseThrow().permisos())
                .containsExactly(Permiso.CONFIGURAR_SEGUNDO_FACTOR);
    }

    @Test
    void debeIncluirLosPermisosConcedidosAMano() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);
        Usuario conExtra = veedor().cambiarPermisos(new PermisosEfectivos(
                RolVeedor.OBSERVADOR, Set.of(Permiso.MODERAR_REPORTES), Set.of()), AHORA);

        String token = provider.emitir(conExtra, AlcanceSesion.COMPLETO);

        assertThat(provider.validar(token).orElseThrow().permisos())
                .contains(Permiso.MODERAR_REPORTES, Permiso.VER_PANEL);
    }

    @Test
    void debeExcluirLosPermisosRevocadosAMano() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);
        Usuario recortado = veedor().cambiarPermisos(new PermisosEfectivos(
                RolVeedor.VEEDOR, Set.of(), Set.of(Permiso.GESTIONAR_CORTES)), AHORA);

        String token = provider.emitir(recortado, AlcanceSesion.COMPLETO);

        assertThat(provider.validar(token).orElseThrow().permisos())
                .doesNotContain(Permiso.GESTIONAR_CORTES)
                .contains(Permiso.MODERAR_REPORTES);
    }

    /** RNF011 — la expiración es de 8 horas y no una propiedad que se pueda relajar sin querer. */
    @Test
    void debeRechazarUnTokenPasadasLasOchoHoras() {
        JwtProvider emisor = new JwtProvider(SECRETO_VALIDO, RELOJ);
        JwtProvider ochoHorasYUnMinutoDespues = new JwtProvider(
                SECRETO_VALIDO, () -> AHORA.plusSeconds(8 * 3600 + 60));

        String token = emisor.emitir(veedor(), AlcanceSesion.COMPLETO);

        assertThat(ochoHorasYUnMinutoDespues.validar(token)).isEmpty();
    }

    @Test
    void debeRechazarUnTokenFirmadoConOtraClave() {
        JwtProvider emisor = new JwtProvider(SECRETO_VALIDO, RELOJ);
        JwtProvider verificador = new JwtProvider("otra-clave-completamente-distinta-32b", RELOJ);

        String token = emisor.emitir(veedor(), AlcanceSesion.COMPLETO);

        assertThat(verificador.validar(token)).isEmpty();
    }

    @Test
    void debeRechazarUnTokenMalformadoSinLanzar() {
        JwtProvider provider = new JwtProvider(SECRETO_VALIDO, RELOJ);

        assertThat(provider.validar("esto-no-es-un-jwt")).isEmpty();
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEstaVacio() {
        JwtProvider provider = new JwtProvider("", RELOJ);

        assertThatIllegalStateException()
                .isThrownBy(() -> provider.emitir(veedor(), AlcanceSesion.COMPLETO));
    }

    @Test
    void debeFallarAlEmitirSiElSecretoEsMasCortoQue32Bytes() {
        JwtProvider provider = new JwtProvider("muy-corto", RELOJ);

        assertThatIllegalStateException()
                .isThrownBy(() -> provider.emitir(veedor(), AlcanceSesion.COMPLETO));
    }

    @Test
    void validarNoDebeLanzarAunqueElSecretoEsteMalConfigurado() {
        JwtProvider provider = new JwtProvider("", RELOJ);

        // Un JWT_SECRET mal configurado no debe convertir "token invalido" en un 500 crudo.
        assertThat(provider.validar("cualquier-token")).isEmpty();
    }
}
