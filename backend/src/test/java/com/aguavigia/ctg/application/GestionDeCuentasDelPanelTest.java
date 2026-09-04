package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.CredencialInvalidaException;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.TokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.AuditoriaRepository;
import com.aguavigia.ctg.domain.port.out.EmisorDeSesionPort;
import com.aguavigia.ctg.domain.port.out.GeneradorSecretosPort;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.domain.port.out.SegundoFactorPort;
import com.aguavigia.ctg.domain.port.out.TokenCuentaRepository;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Las piezas que sostienen el ciclo de vida de una cuenta: los enlaces de un solo uso, el alta del
 * segundo factor, la invitación, el cierre de sesión y el asiento de auditoría.
 */
class GestionDeCuentasDelPanelTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final ClaveHash HASH =
            new ClaveHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
    private static final CorreoElectronico CORREO = new CorreoElectronico("ana@ejemplo.org");
    private static final UsuarioId ID = new UsuarioId("u-1");
    private static final ContextoDeAccion CONTEXTO = new ContextoDeAccion(ID, "10.0.0.1");

    private UsuarioRepository usuarios;
    private TokenCuentaRepository tokens;
    private GeneradorSecretosPort generador;
    private AuditoriaRepository auditoriaRepo;

    @BeforeEach
    void montar() {
        usuarios = mock(UsuarioRepository.class);
        tokens = mock(TokenCuentaRepository.class);
        generador = mock(GeneradorSecretosPort.class);
        auditoriaRepo = mock(AuditoriaRepository.class);

        given(usuarios.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(generador.generarTokenDeEnlace()).willReturn("token-en-claro");
        given(generador.hashDeTokenDeEnlace("token-en-claro")).willReturn("hash-del-token");
    }

    private static Usuario cuenta(EstadoCuenta estado, RolVeedor rol) {
        return new Usuario(ID, CORREO, "Ana", HASH, estado, PermisosEfectivos.deRol(rol), null, AHORA, AHORA);
    }

    private EmisorDeTokensDeCuenta emisor() {
        return new EmisorDeTokensDeCuenta(tokens, usuarios, generador, () -> AHORA);
    }

    // --- Enlaces de un solo uso ---

    @Test
    void emitirDebeGuardarSoloElHashYDevolverElValorEnClaro() {
        String enClaro = emisor().emitir(ID, TipoTokenCuenta.VERIFICACION_CORREO);

        assertThat(enClaro).isEqualTo("token-en-claro");
        ArgumentCaptor<TokenCuenta> guardado = ArgumentCaptor.forClass(TokenCuenta.class);
        verify(tokens).guardar(guardado.capture());
        assertThat(guardado.getValue().hash()).isEqualTo("hash-del-token");
    }

    /** Sin esto, pedir tres veces "olvidé mi clave" deja tres enlaces válidos a la vez. */
    @Test
    void emitirDebeInvalidarLosEnlacesVivosDelMismoTipo() {
        emisor().emitir(ID, TipoTokenCuenta.RESTABLECER_CLAVE);

        verify(tokens).invalidarVigentes(ID, TipoTokenCuenta.RESTABLECER_CLAVE);
    }

    @Test
    void consumirDebeDevolverAlDuenoYQuemarElEnlace() {
        given(tokens.buscarPorHash("hash-del-token")).willReturn(Optional.of(
                TokenCuenta.nuevo("hash-del-token", TipoTokenCuenta.INVITACION, ID, AHORA)));
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.INVITADA, RolVeedor.VEEDOR)));

        Usuario dueno = emisor().consumir("token-en-claro", TipoTokenCuenta.INVITACION);

        assertThat(dueno.id()).isEqualTo(ID);
        ArgumentCaptor<TokenCuenta> guardado = ArgumentCaptor.forClass(TokenCuenta.class);
        verify(tokens).guardar(guardado.capture());
        assertThat(guardado.getValue().usadoEn()).isEqualTo(AHORA);
    }

    /** Un token de verificación no debe servir para restablecer una clave, aunque sea válido. */
    @Test
    void consumirDebeRechazarUnEnlaceDeOtroTipo() {
        given(tokens.buscarPorHash("hash-del-token")).willReturn(Optional.of(
                TokenCuenta.nuevo("hash-del-token", TipoTokenCuenta.VERIFICACION_CORREO, ID, AHORA)));

        assertThatIllegalArgumentException().isThrownBy(
                () -> emisor().consumir("token-en-claro", TipoTokenCuenta.RESTABLECER_CLAVE));
    }

    @Test
    void consumirDebeRechazarUnEnlaceVencido() {
        given(tokens.buscarPorHash("hash-del-token")).willReturn(Optional.of(
                TokenCuenta.nuevo("hash-del-token", TipoTokenCuenta.RESTABLECER_CLAVE, ID,
                        AHORA.minusSeconds(3600))));

        assertThatIllegalArgumentException()
                .isThrownBy(() -> emisor().consumir("token-en-claro", TipoTokenCuenta.RESTABLECER_CLAVE))
                .withMessageContaining("venció");
    }

    @Test
    void consumirDebeRechazarUnEnlaceYaUsado() {
        given(tokens.buscarPorHash("hash-del-token")).willReturn(Optional.of(
                TokenCuenta.nuevo("hash-del-token", TipoTokenCuenta.INVITACION, ID, AHORA)
                        .marcarUsado(AHORA)));

        assertThatIllegalArgumentException().isThrownBy(
                () -> emisor().consumir("token-en-claro", TipoTokenCuenta.INVITACION));
    }

    @Test
    void consumirDebeRechazarUnEnlaceInexistente() {
        given(tokens.buscarPorHash(anyString())).willReturn(Optional.empty());

        assertThatIllegalArgumentException().isThrownBy(
                () -> emisor().consumir("token-en-claro", TipoTokenCuenta.INVITACION));
    }

    @Test
    void consumirDebeRechazarUnEnlaceVacio() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> emisor().consumir("  ", TipoTokenCuenta.INVITACION));
    }

    // --- Auditoría ---

    @Test
    void debeRegistrarQuienLeHizoQueAQuien() {
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN)));

        new RegistroDeAuditoria(auditoriaRepo, usuarios, () -> AHORA)
                .registrar(AccionAuditada.CUENTA_SUSPENDIDA, cuenta(EstadoCuenta.SUSPENDIDA, RolVeedor.VEEDOR),
                        "detalle", CONTEXTO);

        ArgumentCaptor<EventoAuditoria> asiento = ArgumentCaptor.forClass(EventoAuditoria.class);
        verify(auditoriaRepo).registrar(asiento.capture());
        assertThat(asiento.getValue().autorCorreo()).isEqualTo("ana@ejemplo.org");
        assertThat(asiento.getValue().ip()).isEqualTo("10.0.0.1");
        assertThat(asiento.getValue().ocurrioEn()).isEqualTo(AHORA);
    }

    @Test
    void unaAccionDelSistemaDebeQuedarRegistradaSinAutor() {
        new RegistroDeAuditoria(auditoriaRepo, usuarios, () -> AHORA).registrarConAutor(
                AccionAuditada.CUENTA_APROBADA, null, cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN),
                "sembrado", ContextoDeAccion.delSistema());

        ArgumentCaptor<EventoAuditoria> asiento = ArgumentCaptor.forClass(EventoAuditoria.class);
        verify(auditoriaRepo).registrar(asiento.capture());
        assertThat(asiento.getValue().autorId()).isNull();
        assertThat(asiento.getValue().ip()).isEqualTo("sistema");
    }

    /**
     * Decisión incómoda y deliberada: si auditar pudiera tumbar la operación, un Mongo lento
     * impediría suspender la cuenta de alguien que está haciendo daño ahora mismo.
     */
    @Test
    void unFalloAlAuditarNoDebeTumbarLaOperacion() {
        willThrow(new IllegalStateException("Mongo caido")).given(auditoriaRepo).registrar(any());

        new RegistroDeAuditoria(auditoriaRepo, usuarios, () -> AHORA).registrarConAutor(
                AccionAuditada.CUENTA_SUSPENDIDA, null, cuenta(EstadoCuenta.SUSPENDIDA, RolVeedor.VEEDOR),
                "detalle", CONTEXTO);
    }

    // --- Invitación ---

    @Test
    void invitarDebeCrearLaCuentaYMandarElEnlace() {
        NotificacionCuentaPort notificaciones = mock(NotificacionCuentaPort.class);
        given(usuarios.existePorCorreo(any())).willReturn(false);
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN)));

        Usuario invitado = new InvitarUsuarioService(usuarios, emisor(), notificaciones,
                mock(RegistroDeAuditoria.class), () -> AHORA)
                .invitar(new CorreoElectronico("Beto@Ejemplo.ORG"), " Beto ", RolVeedor.OBSERVADOR, CONTEXTO);

        assertThat(invitado.estado()).isEqualTo(EstadoCuenta.INVITADA);
        assertThat(invitado.correo().valor()).isEqualTo("beto@ejemplo.org");
        assertThat(invitado.nombre()).isEqualTo("Beto");
        verify(notificaciones).enviarInvitacion(any(), any(), eq("token-en-claro"));
    }

    /** Aquí sí se dice en claro: quien invita ya está autenticado y tiene la lista delante. */
    @Test
    void invitarDebeRechazarUnCorreoQueYaTieneCuenta() {
        given(usuarios.existePorCorreo(any())).willReturn(true);

        assertThatIllegalStateException()
                .isThrownBy(() -> new InvitarUsuarioService(usuarios, emisor(),
                        mock(NotificacionCuentaPort.class), mock(RegistroDeAuditoria.class), () -> AHORA)
                        .invitar(CORREO, "Ana", RolVeedor.VEEDOR, CONTEXTO))
                .withMessageContaining("Ya existe");
    }

    // --- Segundo factor ---

    private ConfigurarSegundoFactorService segundoFactor(SegundoFactorPort totp,
                                                         EmisorDeSesionPort sesiones,
                                                         RevocacionSesionPort revocacion) {
        given(generador.generarSecretoTotp()).willReturn(new SecretoTotp("GEZDGNBVGY3TQOJQ"));
        return new ConfigurarSegundoFactorService(usuarios, generador, totp, sesiones, revocacion,
                mock(RegistroDeAuditoria.class), () -> AHORA);
    }

    @Test
    void iniciarElAltaDebeGuardarElSecretoSinConfirmarYDevolverElQr() {
        SegundoFactorPort totp = mock(SegundoFactorPort.class);
        given(totp.uriDeAlta(any(), any())).willReturn("otpauth://totp/...");
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN)));

        var alta = segundoFactor(totp, mock(EmisorDeSesionPort.class), mock(RevocacionSesionPort.class))
                .iniciar(ID, CONTEXTO);

        assertThat(alta.uri()).startsWith("otpauth://");
        assertThat(alta.secreto()).isEqualTo("GEZDGNBVGY3TQOJQ");

        ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).guardar(guardado.capture());
        assertThat(guardado.getValue().tieneSegundoFactorConfirmado()).isFalse();
    }

    /** Canjea la sesión restringida por una completa: si no, habría que reescribir la clave. */
    @Test
    void confirmarElAltaDebeDevolverUnaSesionDeAlcanceCompleto() {
        SegundoFactorPort totp = mock(SegundoFactorPort.class);
        EmisorDeSesionPort sesiones = mock(EmisorDeSesionPort.class);
        given(totp.codigoEsValido(any(), eq("123456"))).willReturn(true);
        given(sesiones.emitir(any(), eq(AlcanceSesion.COMPLETO))).willReturn("token-completo");
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), AHORA)));

        String token = segundoFactor(totp, sesiones, mock(RevocacionSesionPort.class))
                .confirmar(ID, "123456", CONTEXTO);

        assertThat(token).isEqualTo("token-completo");
    }

    @Test
    void confirmarConUnCodigoEquivocadoNoDebeActivarNada() {
        SegundoFactorPort totp = mock(SegundoFactorPort.class);
        given(totp.codigoEsValido(any(), anyString())).willReturn(false);
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.ADMIN)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), AHORA)));

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> segundoFactor(totp, mock(EmisorDeSesionPort.class),
                        mock(RevocacionSesionPort.class)).confirmar(ID, "000000", CONTEXTO));

        verify(usuarios, never()).guardar(any());
    }

    @Test
    void confirmarSinUnAltaEnCursoDebeFallar() {
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)));

        assertThatIllegalStateException().isThrownBy(() -> segundoFactor(mock(SegundoFactorPort.class),
                mock(EmisorDeSesionPort.class), mock(RevocacionSesionPort.class))
                .confirmar(ID, "123456", CONTEXTO));
    }

    /** Si bastara con la sesión, un token robado podría quitar la defensa que impide usarlo. */
    @Test
    void desactivarElSegundoFactorDebeExigirUnCodigoValido() {
        SegundoFactorPort totp = mock(SegundoFactorPort.class);
        given(totp.codigoEsValido(any(), anyString())).willReturn(false);
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), AHORA)
                .confirmarSegundoFactor(AHORA)));

        assertThatExceptionOfType(CredencialInvalidaException.class)
                .isThrownBy(() -> segundoFactor(totp, mock(EmisorDeSesionPort.class),
                        mock(RevocacionSesionPort.class)).desactivar(ID, "000000", CONTEXTO));
    }

    @Test
    void desactivarConCodigoValidoDebeQuitarloYRevocarLasSesiones() {
        SegundoFactorPort totp = mock(SegundoFactorPort.class);
        RevocacionSesionPort revocacion = mock(RevocacionSesionPort.class);
        given(totp.codigoEsValido(any(), eq("123456"))).willReturn(true);
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), AHORA)
                .confirmarSegundoFactor(AHORA)));

        segundoFactor(totp, mock(EmisorDeSesionPort.class), revocacion)
                .desactivar(ID, "123456", CONTEXTO);

        verify(revocacion).revocarSesionesAnterioresA(ID, AHORA);
    }

    @Test
    void desactivarSinTenerloActivoDebeFallar() {
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)));

        assertThatIllegalStateException().isThrownBy(() -> segundoFactor(mock(SegundoFactorPort.class),
                mock(EmisorDeSesionPort.class), mock(RevocacionSesionPort.class))
                .desactivar(ID, "123456", CONTEXTO));
    }

    @Test
    void unaSesionQueYaNoCorrespondeAUnaCuentaDebeFallar() {
        given(usuarios.buscarPorId(ID)).willReturn(Optional.empty());

        assertThatIllegalStateException().isThrownBy(() -> segundoFactor(mock(SegundoFactorPort.class),
                mock(EmisorDeSesionPort.class), mock(RevocacionSesionPort.class)).iniciar(ID, CONTEXTO));
    }

    // --- Cierre de sesión y consultas ---

    @Test
    void cerrarSesionDebeRevocarEnElServidor() {
        RevocacionSesionPort revocacion = mock(RevocacionSesionPort.class);

        new CerrarSesionService(revocacion, () -> AHORA).cerrar(ID);

        verify(revocacion).revocarSesionesAnterioresA(ID, AHORA);
    }

    @Test
    void listarDebeAcotarElTamanoDePaginaQueLlegaDeFuera() {
        given(usuarios.listar(any(), eq(0), eq(Pagina.TAMANO_MAXIMO)))
                .willReturn(new Pagina<>(List.of(), 0, Pagina.TAMANO_MAXIMO, 0));

        new ConsultarCuentasService(usuarios, auditoriaRepo).listar(null, -5, 9999);

        verify(usuarios).listar(null, 0, Pagina.TAMANO_MAXIMO);
    }

    @Test
    void debeDevolverLaCuentaBuscadaPorSuId() {
        given(usuarios.buscarPorId(ID)).willReturn(Optional.of(cuenta(EstadoCuenta.ACTIVA, RolVeedor.VEEDOR)));

        assertThat(new ConsultarCuentasService(usuarios, auditoriaRepo).buscar(ID)).isPresent();
    }

    @Test
    void debeDevolverLaAuditoriaPaginada() {
        given(auditoriaRepo.listar(0, Pagina.TAMANO_POR_DEFECTO))
                .willReturn(new Pagina<>(List.of(), 0, Pagina.TAMANO_POR_DEFECTO, 0));

        // tamaño 0 no es un 400: Pagina.tamanoValido lo normaliza al valor por defecto.
        assertThat(new ConsultarCuentasService(usuarios, auditoriaRepo).auditoria(0, 0).contenido())
                .isEmpty();
    }
}
