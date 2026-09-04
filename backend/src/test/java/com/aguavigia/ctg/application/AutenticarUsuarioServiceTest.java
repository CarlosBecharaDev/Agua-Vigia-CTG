package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.CredencialInvalidaException;
import com.aguavigia.ctg.domain.CuentaBloqueadaException;
import com.aguavigia.ctg.domain.CuentaNoHabilitadaException;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.SegundoFactorRequeridoException;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.CifradorClavePort;
import com.aguavigia.ctg.domain.port.out.ControlIntentosPort;
import com.aguavigia.ctg.domain.port.out.EmisorDeSesionPort;
import com.aguavigia.ctg.domain.port.out.SegundoFactorPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * El camino por el que se emite toda sesión del panel. Las pruebas se agrupan por la propiedad de
 * seguridad que sostienen, no por el método: lo que importa no es que devuelva un token, sino que
 * no diga de más al equivocarse y que no deje entrar a quien no debe.
 */
class AutenticarUsuarioServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final String CLAVE = "clave-larga-y-variada";
    private static final ClaveHash HASH =
            new ClaveHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
    private static final CorreoElectronico CORREO = new CorreoElectronico("ana@ejemplo.org");
    private static final ContextoDeAccion CONTEXTO = ContextoDeAccion.anonimo("10.0.0.1");

    private UsuarioRepository usuarios;
    private CifradorClavePort cifrador;
    private SegundoFactorPort segundoFactor;
    private ControlIntentosPort intentos;
    private EmisorDeSesionPort emisor;
    private RegistroDeAuditoria auditoria;
    private AutenticarUsuarioService servicio;

    @BeforeEach
    void montar() {
        usuarios = mock(UsuarioRepository.class);
        cifrador = mock(CifradorClavePort.class);
        segundoFactor = mock(SegundoFactorPort.class);
        intentos = mock(ControlIntentosPort.class);
        emisor = mock(EmisorDeSesionPort.class);
        auditoria = mock(RegistroDeAuditoria.class);

        given(intentos.bloqueoVigente(anyString())).willReturn(Optional.empty());
        given(intentos.consumirPorPrimeraVez(anyString(), any())).willReturn(true);
        given(emisor.emitir(any(), any())).willReturn("token-emitido");

        servicio = new AutenticarUsuarioService(usuarios, cifrador, segundoFactor, intentos, emisor,
                auditoria, 5, 15, 15);
    }

    private Usuario cuenta(EstadoCuenta estado, RolVeedor rol) {
        return new Usuario(new UsuarioId("u-1"), CORREO, "Ana", HASH, estado,
                PermisosEfectivos.deRol(rol), null, AHORA, AHORA);
    }

    private void existeLaCuenta(Usuario usuario) {
        given(usuarios.buscarPorCorreo(any())).willReturn(Optional.of(usuario));
    }

    private void laClaveEsCorrecta() {
        given(cifrador.coincide(eq(CLAVE), any())).willReturn(true);
    }

    @Test
    void debeEmitirSesionConCredencialCorrecta() {
        existeLaCuenta(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));
        laClaveEsCorrecta();

        var sesion = servicio.autenticar(CORREO, CLAVE, null, CONTEXTO);

        assertThat(sesion.token()).isEqualTo("token-emitido");
        assertThat(sesion.alcance()).isEqualTo(AlcanceSesion.COMPLETO);
        assertThat(sesion.rol()).isEqualTo(RolVeedor.VEEDOR);
    }

    @Test
    void unIngresoCorrectoDebeLimpiarLosIntentosFallidosAcumulados() {
        existeLaCuenta(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));
        laClaveEsCorrecta();

        servicio.autenticar(CORREO, CLAVE, null, CONTEXTO);

        verify(intentos).limpiarIntentos("ana@ejemplo.org");
    }

    /**
     * La propiedad que impide usar el login como buscador de cuentas: correo inexistente y clave
     * equivocada dan la misma excepción con el mismo texto.
     */
    @Test
    void unCorreoInexistenteYUnaClaveEquivocadaDebenDarLaMismaRespuesta() {
        given(usuarios.buscarPorCorreo(any())).willReturn(Optional.empty());
        String mensajeSinCuenta = capturarMensajeDeCredencialInvalida();

        existeLaCuenta(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));
        given(cifrador.coincide(anyString(), any())).willReturn(false);
        String mensajeClaveMala = capturarMensajeDeCredencialInvalida();

        assertThat(mensajeSinCuenta).isEqualTo(mensajeClaveMala);
    }

    private String capturarMensajeDeCredencialInvalida() {
        try {
            servicio.autenticar(CORREO, "lo-que-sea-largo", null, CONTEXTO);
            throw new AssertionError("Debía rechazar la credencial");
        } catch (CredencialInvalidaException esperada) {
            return esperada.getMessage();
        }
    }

    /** Sin esto, dan igual los mensajes: el cronómetro dice qué correos tienen cuenta. */
    @Test
    void conUnCorreoInexistenteDebeGastarElMismoTiempoQueUnIntentoReal() {
        given(usuarios.buscarPorCorreo(any())).willReturn(Optional.empty());

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));

        verify(cifrador).gastarTiempoEquivalente();
    }

    @Test
    void unCorreoInexistenteTambienDebeContarComoIntentoFallido() {
        given(usuarios.buscarPorCorreo(any())).willReturn(Optional.empty());

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));

        verify(intentos).registrarFallo(eq("ana@ejemplo.org"), any(), anyInt(), any());
    }

    /**
     * El bloqueo se mira antes de nada: si no, cada intento durante un bloqueo seguiría costando un
     * BCrypt y el propio freno sería el vector de agotamiento de CPU.
     */
    @Test
    void conLaCuentaBloqueadaNoDebeNiConsultarLaBaseDeDatos() {
        given(intentos.bloqueoVigente(anyString())).willReturn(Optional.of(Duration.ofMinutes(10)));

        assertThatExceptionOfType(CuentaBloqueadaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));

        verify(usuarios, never()).buscarPorCorreo(any());
        verify(cifrador, never()).coincide(anyString(), any());
    }

    /** El estado se revisa después de la clave: antes, sería regalar media respuesta. */
    @Test
    void unaCuentaSuspendidaConLaClaveCorrectaDebeRecibirElMotivo() {
        existeLaCuenta(cuenta(EstadoCuenta.SUSPENDIDA, RolVeedor.VEEDOR));
        laClaveEsCorrecta();

        assertThatExceptionOfType(CuentaNoHabilitadaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO))
                .satisfies(e -> assertThat(e.estado()).isEqualTo(EstadoCuenta.SUSPENDIDA));
    }

    @Test
    void unaCuentaSuspendidaConLaClaveEquivocadaNoDebeRevelarSuEstado() {
        existeLaCuenta(cuenta(EstadoCuenta.SUSPENDIDA, RolVeedor.VEEDOR));
        given(cifrador.coincide(anyString(), any())).willReturn(false);

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, "clave-equivocada", null, CONTEXTO));
    }

    @Test
    void unaCuentaSinAprobarNoDebePoderEntrar() {
        existeLaCuenta(cuenta(EstadoCuenta.PENDIENTE_APROBACION, RolVeedor.VEEDOR));
        laClaveEsCorrecta();

        assertThatExceptionOfType(CuentaNoHabilitadaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));
    }

    private Usuario conSegundoFactorConfirmado() {
        return cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), AHORA)
                .confirmarSegundoFactor(AHORA);
    }

    @Test
    void siLaCuentaTieneSegundoFactorYNoLlegaCodigoDebePedirlo() {
        existeLaCuenta(conSegundoFactorConfirmado());
        laClaveEsCorrecta();

        assertThatExceptionOfType(SegundoFactorRequeridoException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));
    }

    /** Pedir el código no es fallar: contarlo bloquearía a quien hace justo lo que el flujo espera. */
    @Test
    void pedirElCodigoNoDebeContarComoIntentoFallido() {
        existeLaCuenta(conSegundoFactorConfirmado());
        laClaveEsCorrecta();

        assertThatExceptionOfType(SegundoFactorRequeridoException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));

        verify(intentos, never()).registrarFallo(anyString(), any(), anyInt(), any());
    }

    @Test
    void debeEmitirSesionConElCodigoCorrecto() {
        existeLaCuenta(conSegundoFactorConfirmado());
        laClaveEsCorrecta();
        given(segundoFactor.codigoEsValido(any(), eq("123456"))).willReturn(true);

        assertThat(servicio.autenticar(CORREO, CLAVE, "123456", CONTEXTO).token())
                .isEqualTo("token-emitido");
    }

    @Test
    void unCodigoEquivocadoDebeContarComoIntentoFallido() {
        existeLaCuenta(conSegundoFactorConfirmado());
        laClaveEsCorrecta();
        given(segundoFactor.codigoEsValido(any(), anyString())).willReturn(false);

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, "000000", CONTEXTO));

        verify(intentos).registrarFallo(eq("ana@ejemplo.org"), any(), anyInt(), any());
    }

    /** Un código vale unos segundos; sin esto vale esos segundos para cualquiera que lo vea pasar. */
    @Test
    void debeRechazarUnCodigoCorrectoQueYaSeUso() {
        existeLaCuenta(conSegundoFactorConfirmado());
        laClaveEsCorrecta();
        given(segundoFactor.codigoEsValido(any(), eq("123456"))).willReturn(true);
        given(intentos.consumirPorPrimeraVez(anyString(), any())).willReturn(false);

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, "123456", CONTEXTO));
    }

    /**
     * El arranque del primer ADMIN: no se le cierra la puerta por no tener TOTP, pero su sesión no
     * sirve para nada más que darlo de alta.
     */
    @Test
    void unAdminSinSegundoFactorDebeEntrarConAlcanceRestringido() {
        existeLaCuenta(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN));
        laClaveEsCorrecta();

        var sesion = servicio.autenticar(CORREO, CLAVE, null, CONTEXTO);

        assertThat(sesion.alcance()).isEqualTo(AlcanceSesion.ALTA_SEGUNDO_FACTOR);
        assertThat(sesion.permisos())
                .containsExactly(com.aguavigia.ctg.domain.Permiso.CONFIGURAR_SEGUNDO_FACTOR);
    }

    @Test
    void unaCuentaInvitadaSinClaveNoDebePoderEntrar() {
        given(usuarios.buscarPorCorreo(any())).willReturn(Optional.of(Usuario.invitado(
                new UsuarioId("u-2"), CORREO, "Beto", RolVeedor.VEEDOR, AHORA)));

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> servicio.autenticar(CORREO, CLAVE, null, CONTEXTO));
    }

    @Test
    void debeBuscarLaCuentaPorElCorreoNormalizado() {
        existeLaCuenta(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));
        laClaveEsCorrecta();

        servicio.autenticar(new CorreoElectronico("Ana@Ejemplo.ORG"), CLAVE, null, CONTEXTO);

        verify(usuarios).buscarPorCorreo(new CorreoElectronico("ana@ejemplo.org"));
    }
}
