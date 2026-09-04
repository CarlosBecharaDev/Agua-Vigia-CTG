package com.aguavigia.ctg.infrastructure.security;

import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * El filtro corre en **toda** petición, incluidas las públicas. Un token ausente, vencido o mal
 * firmado no puede romper una ruta que ni siquiera exige autenticación (RF019: el resto de la
 * plataforma es pública) — decidir eso es cosa de SecurityConfig, no de este filtro.
 */
class JwtAuthenticationFilterTest {

    private static final Instant EMITIDO_EN = Instant.parse("2026-08-09T20:00:00Z");

    private JwtProvider jwtProvider;
    private RevocacionSesionPort revocacion;
    private JwtAuthenticationFilter filtro;
    private MockHttpServletRequest peticion;
    private MockHttpServletResponse respuesta;
    private FilterChain cadena;

    @BeforeEach
    void montar() {
        jwtProvider = mock(JwtProvider.class);
        revocacion = mock(RevocacionSesionPort.class);
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());
        filtro = new JwtAuthenticationFilter(jwtProvider, revocacion);
        peticion = new MockHttpServletRequest();
        respuesta = new MockHttpServletResponse();
        cadena = mock(FilterChain.class);
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private static SesionAutenticada sesion(Permiso... permisos) {
        return new SesionAutenticada("u-1", "veedor@aguavigia.test", "Veedor", "VEEDOR",
                Set.of(permisos), AlcanceSesion.COMPLETO, EMITIDO_EN);
    }

    private void conToken(String token, SesionAutenticada sesion) {
        peticion.addHeader("Authorization", "Bearer " + token);
        given(jwtProvider.validar(token)).willReturn(Optional.ofNullable(sesion));
    }

    private void ejecutar() throws Exception {
        filtro.doFilter(peticion, respuesta, cadena);
    }

    private Authentication autenticacion() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Test
    void debeAutenticarConUnTokenValido() throws Exception {
        conToken("token-bueno", sesion(Permiso.VER_PANEL));

        ejecutar();

        assertThat(autenticacion()).isNotNull();
        assertThat(autenticacion().getPrincipal()).isInstanceOf(SesionAutenticada.class);
        verify(cadena).doFilter(peticion, respuesta);
    }

    /** Cada permiso del token tiene que llegar como autoridad `PERM_*` o los `@PreAuthorize` no ven nada. */
    @Test
    void debeTraducirCadaPermisoAUnaAutoridadConPrefijo() throws Exception {
        conToken("token-bueno", sesion(Permiso.VER_PANEL, Permiso.MODERAR_REPORTES));

        ejecutar();

        assertThat(autenticacion().getAuthorities())
                .extracting(Object::toString)
                .containsExactlyInAnyOrder("PERM_VER_PANEL", "PERM_MODERAR_REPORTES");
    }

    @Test
    void sinEncabezadoDebeSeguirLaCadenaSinAutenticar() throws Exception {
        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void conUnTokenInvalidoDebeSeguirLaCadenaSinAutenticar() throws Exception {
        conToken("token-vencido", null);

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    /** Sin el prefijo Bearer no hay nada que validar; la petición sigue como anónima. */
    @Test
    void debeIgnorarUnEncabezadoQueNoEsBearer() throws Exception {
        peticion.addHeader("Authorization", "Basic dXN1YXJpbzpjbGF2ZQ==");

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void unBearerVacioNoDebeRomperLaPeticion() throws Exception {
        conToken("", null);

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    /** Suspender a alguien tiene que sacarlo ya, no cuando su token caduque hasta 8 horas después. */
    @Test
    void debeRechazarUnTokenEmitidoAntesDeLaRevocacion() throws Exception {
        conToken("token-revocado", sesion(Permiso.VER_PANEL));
        given(revocacion.revocadasAntesDe(new UsuarioId("u-1")))
                .willReturn(Optional.of(EMITIDO_EN.plusSeconds(1)));

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void debeAceptarUnTokenEmitidoDespuesDeLaRevocacion() throws Exception {
        conToken("token-nuevo", sesion(Permiso.VER_PANEL));
        given(revocacion.revocadasAntesDe(new UsuarioId("u-1")))
                .willReturn(Optional.of(EMITIDO_EN.minusSeconds(60)));

        ejecutar();

        assertThat(autenticacion()).isNotNull();
    }

    /**
     * Falla cerrado: si no se puede consultar Redis no se sabe si la sesión sigue viva, y darla por
     * buena dejaría entrar a una cuenta suspendida justo durante una caída.
     */
    @Test
    void siNoSePuedeVerificarLaRevocacionNoDebeAutenticar() throws Exception {
        conToken("token-bueno", sesion(Permiso.VER_PANEL));
        given(revocacion.revocadasAntesDe(new UsuarioId("u-1")))
                .willThrow(new IllegalStateException("Redis caido"));

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }
}
