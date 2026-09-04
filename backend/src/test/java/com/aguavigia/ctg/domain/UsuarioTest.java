package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

class UsuarioTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final Instant DESPUES = AHORA.plusSeconds(3600);
    private static final ClaveHash HASH =
            new ClaveHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");

    private static Usuario registrado() {
        return Usuario.registrado(new UsuarioId("u-1"), new CorreoElectronico("ana@ejemplo.org"),
                "Ana", HASH, AHORA);
    }

    private static Usuario activo() {
        return registrado().verificarCorreo(AHORA)
                .aprobar(PermisosEfectivos.deRol(RolVeedor.VEEDOR), AHORA);
    }

    @Test
    void quienSeRegistraNaceSinPoderEntrarYSinPermisosUtiles() {
        Usuario nuevo = registrado();

        assertThat(nuevo.estado()).isEqualTo(EstadoCuenta.PENDIENTE_VERIFICACION);
        assertThat(nuevo.estado().permiteIniciarSesion()).isFalse();
        assertThat(nuevo.permisosEfectivos()).doesNotContain(Permiso.MODERAR_REPORTES);
    }

    @Test
    void debeRechazarUnRegistroSinClave() {
        assertThatIllegalArgumentException().isThrownBy(() -> Usuario.registrado(
                new UsuarioId("u-1"), new CorreoElectronico("ana@ejemplo.org"), "Ana", null, AHORA));
    }

    /** El paso que hace que el registro abierto no sea una puerta: verificar no da acceso. */
    @Test
    void verificarElCorreoNoDebeActivarLaCuenta() {
        Usuario verificado = registrado().verificarCorreo(AHORA);

        assertThat(verificado.estado()).isEqualTo(EstadoCuenta.PENDIENTE_APROBACION);
        assertThat(verificado.estado().permiteIniciarSesion()).isFalse();
    }

    @Test
    void debeRechazarVerificarDosVeces() {
        Usuario verificado = registrado().verificarCorreo(AHORA);

        assertThatIllegalStateException().isThrownBy(() -> verificado.verificarCorreo(DESPUES));
    }

    @Test
    void aprobarDebeActivarLaCuentaConLosPermisosQueSeLeAsignan() {
        Usuario aprobado = registrado().verificarCorreo(AHORA)
                .aprobar(PermisosEfectivos.deRol(RolVeedor.VEEDOR), DESPUES);

        assertThat(aprobado.estado()).isEqualTo(EstadoCuenta.ACTIVA);
        assertThat(aprobado.permisosEfectivos()).contains(Permiso.MODERAR_REPORTES);
        assertThat(aprobado.actualizadoEn()).isEqualTo(DESPUES);
    }

    @Test
    void debeRechazarAprobarUnaCuentaQueNoVerificoSuCorreo() {
        Usuario sinVerificar = registrado();

        assertThatIllegalStateException().isThrownBy(
                () -> sinVerificar.aprobar(PermisosEfectivos.deRol(RolVeedor.VEEDOR), AHORA));
    }

    @Test
    void unaCuentaInvitadaNaceSinClaveYConSuRolYaDecidido() {
        Usuario invitado = Usuario.invitado(new UsuarioId("u-2"),
                new CorreoElectronico("beto@ejemplo.org"), "Beto", RolVeedor.OBSERVADOR, AHORA);

        assertThat(invitado.estado()).isEqualTo(EstadoCuenta.INVITADA);
        assertThat(invitado.claveHash()).isNull();
        assertThat(invitado.permisos().rol()).isEqualTo(RolVeedor.OBSERVADOR);
    }

    @Test
    void aceptarLaInvitacionDebeDejarLaCuentaActivaSinOtraAprobacion() {
        Usuario invitado = Usuario.invitado(new UsuarioId("u-2"),
                new CorreoElectronico("beto@ejemplo.org"), "Beto", RolVeedor.VEEDOR, AHORA);

        Usuario activo = invitado.aceptarInvitacion(HASH, DESPUES);

        assertThat(activo.estado()).isEqualTo(EstadoCuenta.ACTIVA);
        assertThat(activo.claveHash()).isEqualTo(HASH);
    }

    /** La invariante que sostiene todo lo demás: ninguna cuenta llega a ACTIVA sin clave. */
    @Test
    void debeRechazarUnaCuentaActivaSinClave() {
        assertThatIllegalArgumentException().isThrownBy(() -> new Usuario(
                new UsuarioId("u-1"), new CorreoElectronico("ana@ejemplo.org"), "Ana", null,
                EstadoCuenta.ACTIVA, PermisosEfectivos.deRol(RolVeedor.VEEDOR), null, AHORA, AHORA));
    }

    @Test
    void suspenderYReactivarDebenSerReversibles() {
        Usuario suspendido = activo().suspender(DESPUES);
        assertThat(suspendido.estado()).isEqualTo(EstadoCuenta.SUSPENDIDA);
        assertThat(suspendido.estado().permiteIniciarSesion()).isFalse();

        assertThat(suspendido.reactivar(DESPUES).estado()).isEqualTo(EstadoCuenta.ACTIVA);
    }

    @Test
    void debeRechazarSuspenderUnaCuentaQueNoEstaActiva() {
        assertThatIllegalStateException().isThrownBy(() -> registrado().suspender(AHORA));
    }

    /** Rechazar es para solicitudes; una cuenta que ya entró en servicio se suspende. */
    @Test
    void debeRechazarQueSeRechaceUnaCuentaYaActiva() {
        assertThatIllegalStateException().isThrownBy(() -> activo().rechazar(DESPUES));
    }

    @Test
    void rechazarDebeSerTerminal() {
        Usuario rechazado = registrado().rechazar(DESPUES);

        assertThat(rechazado.estado()).isEqualTo(EstadoCuenta.RECHAZADA);
        assertThatIllegalStateException().isThrownBy(() -> rechazado.rechazar(DESPUES));
        assertThatIllegalStateException().isThrownBy(() -> rechazado.cambiarClave(HASH, DESPUES));
    }

    @Test
    void elSegundoFactorNoDebeExigirseHastaQueSeConfirma() {
        Usuario conAltaEnCurso = activo()
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), DESPUES);

        assertThat(conAltaEnCurso.tieneSegundoFactorConfirmado()).isFalse();
        assertThat(conAltaEnCurso.confirmarSegundoFactor(DESPUES).tieneSegundoFactorConfirmado()).isTrue();
    }

    @Test
    void debeRechazarConfirmarUnSegundoFactorQueNoSeInicio() {
        assertThatIllegalStateException().isThrownBy(() -> activo().confirmarSegundoFactor(DESPUES));
    }

    /** El ADMIN entra con alcance restringido hasta que da de alta su TOTP; no se le cierra la puerta. */
    @Test
    void unAdminSinSegundoFactorDebeTenerQueCompletarSuAlta() {
        Usuario admin = activo().cambiarPermisos(PermisosEfectivos.deRol(RolVeedor.ADMIN), DESPUES);

        assertThat(admin.debeCompletarAltaDeSegundoFactor()).isTrue();

        Usuario conTotp = admin.iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), DESPUES)
                .confirmarSegundoFactor(DESPUES);
        assertThat(conTotp.debeCompletarAltaDeSegundoFactor()).isFalse();
    }

    @Test
    void unAdminNoDebePoderDesactivarSuSegundoFactor() {
        Usuario admin = activo()
                .cambiarPermisos(PermisosEfectivos.deRol(RolVeedor.ADMIN), DESPUES)
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), DESPUES)
                .confirmarSegundoFactor(DESPUES);

        assertThatIllegalStateException().isThrownBy(() -> admin.desactivarSegundoFactor(DESPUES));
    }

    @Test
    void unVeedorSiDebePoderDesactivarSuSegundoFactor() {
        Usuario veedor = activo()
                .iniciarSegundoFactor(new SecretoTotp("GEZDGNBVGY3TQOJQ"), DESPUES)
                .confirmarSegundoFactor(DESPUES);

        assertThat(veedor.desactivarSegundoFactor(DESPUES).segundoFactor()).isNull();
    }

    @Test
    void cambiarPermisosDebeRespetarLosAjustesPorPersona() {
        Usuario recortado = activo().cambiarPermisos(new PermisosEfectivos(
                RolVeedor.VEEDOR, Set.of(), Set.of(Permiso.GESTIONAR_CORTES)), DESPUES);

        assertThat(recortado.permisosEfectivos())
                .contains(Permiso.MODERAR_REPORTES)
                .doesNotContain(Permiso.GESTIONAR_CORTES);
    }

    @Test
    void todoCambioDebeExigirUnInstante() {
        assertThatIllegalArgumentException().isThrownBy(() -> activo().suspender(null));
    }
}
