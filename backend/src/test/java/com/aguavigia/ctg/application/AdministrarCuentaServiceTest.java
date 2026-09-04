package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Las tres guardas que este servicio existe para sostener: nadie se administra a sí mismo, siempre
 * queda un ADMIN activo, y todo cambio de acceso revoca las sesiones vivas del afectado.
 */
class AdministrarCuentaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T20:00:00Z");
    private static final ClaveHash HASH =
            new ClaveHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
    private static final UsuarioId ADMIN_ID = new UsuarioId("admin-1");
    private static final UsuarioId SUJETO_ID = new UsuarioId("u-2");
    private static final ContextoDeAccion CONTEXTO = new ContextoDeAccion(ADMIN_ID, "10.0.0.1");

    private UsuarioRepository usuarios;
    private RevocacionSesionPort revocacion;
    private NotificacionCuentaPort notificaciones;
    private RegistroDeAuditoria auditoria;
    private AdministrarCuentaService servicio;

    @BeforeEach
    void montar() {
        usuarios = mock(UsuarioRepository.class);
        revocacion = mock(RevocacionSesionPort.class);
        notificaciones = mock(NotificacionCuentaPort.class);
        auditoria = mock(RegistroDeAuditoria.class);

        given(usuarios.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(usuarios.buscarPorId(ADMIN_ID)).willReturn(Optional.of(
                cuenta(ADMIN_ID, "admin@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.ADMIN)));
        given(usuarios.contarActivosPorRol(RolVeedor.ADMIN)).willReturn(2L);

        servicio = new AdministrarCuentaService(usuarios, revocacion, notificaciones, auditoria, () -> AHORA);
    }

    private static Usuario cuenta(UsuarioId id, String correo, EstadoCuenta estado, RolVeedor rol) {
        return new Usuario(id, new CorreoElectronico(correo), "Alguien", HASH, estado,
                PermisosEfectivos.deRol(rol), null, AHORA, AHORA);
    }

    private void elSujetoEs(Usuario usuario) {
        given(usuarios.buscarPorId(SUJETO_ID)).willReturn(Optional.of(usuario));
    }

    @Test
    void aprobarDebeActivarLaCuentaYAvisarPorCorreo() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.PENDIENTE_APROBACION, RolVeedor.OBSERVADOR));

        Usuario aprobado = servicio.aprobar(
                SUJETO_ID, PermisosEfectivos.deRol(RolVeedor.VEEDOR), CONTEXTO);

        assertThat(aprobado.estado()).isEqualTo(EstadoCuenta.ACTIVA);
        assertThat(aprobado.permisosEfectivos()).contains(Permiso.MODERAR_REPORTES);
        verify(notificaciones).avisarCambioDeAcceso(any(), anyString(), anyString());
    }

    @Test
    void aprobarDebeQuedarRegistradoEnLaAuditoria() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.PENDIENTE_APROBACION, RolVeedor.OBSERVADOR));

        servicio.aprobar(SUJETO_ID, PermisosEfectivos.deRol(RolVeedor.VEEDOR), CONTEXTO);

        verify(auditoria).registrarConAutor(
                eq(AccionAuditada.CUENTA_APROBADA), any(), any(), anyString(), eq(CONTEXTO));
    }

    /** Sin esto, suspender a alguien no lo saca: su token sigue firmado y válido hasta 8 horas más. */
    @Test
    void suspenderDebeRevocarLasSesionesVivasDelAfectado() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));

        servicio.suspender(SUJETO_ID, CONTEXTO);

        verify(revocacion).revocarSesionesAnterioresA(SUJETO_ID, AHORA);
    }

    @Test
    void rechazarDebeRevocarLasSesionesVivasDelAfectado() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.PENDIENTE_APROBACION, RolVeedor.OBSERVADOR));

        servicio.rechazar(SUJETO_ID, CONTEXTO);

        verify(revocacion).revocarSesionesAnterioresA(SUJETO_ID, AHORA);
    }

    /**
     * También al ampliar permisos, no solo al recortarlos: el token los lleva dentro, así que una
     * sesión abierta seguiría usando los viejos.
     */
    @Test
    void ampliarPermisosTambienDebeRevocarLaSesion() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.OBSERVADOR));

        servicio.cambiarPermisos(SUJETO_ID, PermisosEfectivos.deRol(RolVeedor.VEEDOR), CONTEXTO);

        verify(revocacion).revocarSesionesAnterioresA(SUJETO_ID, AHORA);
    }

    @Test
    void debeAplicarLosAjustesDePermisosPorPersona() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.VEEDOR));

        Usuario actualizado = servicio.cambiarPermisos(SUJETO_ID, new PermisosEfectivos(
                RolVeedor.VEEDOR, Set.of(), Set.of(Permiso.GESTIONAR_CORTES)), CONTEXTO);

        assertThat(actualizado.permisosEfectivos())
                .contains(Permiso.MODERAR_REPORTES)
                .doesNotContain(Permiso.GESTIONAR_CORTES);
    }

    /** Un ADMIN que se suspende o se despromueve se deja fuera sin manera de volver. */
    @Test
    void unAdminNoDebePoderSuspenderseASiMismo() {
        assertThatIllegalStateException()
                .isThrownBy(() -> servicio.suspender(ADMIN_ID, CONTEXTO))
                .withMessageContaining("sí mismo");
    }

    @Test
    void unAdminNoDebePoderCambiarseSusPropiosPermisos() {
        assertThatIllegalStateException().isThrownBy(() -> servicio.cambiarPermisos(
                ADMIN_ID, PermisosEfectivos.deRol(RolVeedor.OBSERVADOR), CONTEXTO));
    }

    @Test
    void unAdminNoDebePoderAprobarseASiMismo() {
        assertThatIllegalStateException().isThrownBy(() -> servicio.aprobar(
                ADMIN_ID, PermisosEfectivos.deRol(RolVeedor.ADMIN), CONTEXTO));
    }

    /**
     * Dejar el sistema sin ADMIN no se arregla desde la aplicación: hay que ir a Mongo a mano. Se
     * rechaza antes de que ocurra.
     */
    @Test
    void noDebePoderSuspenderseAlUnicoAdministradorActivo() {
        given(usuarios.contarActivosPorRol(RolVeedor.ADMIN)).willReturn(1L);
        elSujetoEs(cuenta(SUJETO_ID, "otro@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.ADMIN));

        assertThatIllegalStateException()
                .isThrownBy(() -> servicio.suspender(SUJETO_ID, CONTEXTO))
                .withMessageContaining("único administrador activo");
    }

    @Test
    void noDebePoderDespromoverseAlUnicoAdministradorActivo() {
        given(usuarios.contarActivosPorRol(RolVeedor.ADMIN)).willReturn(1L);
        elSujetoEs(cuenta(SUJETO_ID, "otro@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.ADMIN));

        assertThatIllegalStateException().isThrownBy(() -> servicio.cambiarPermisos(
                SUJETO_ID, PermisosEfectivos.deRol(RolVeedor.VEEDOR), CONTEXTO));
    }

    @Test
    void siQuedanDosAdministradoresSiDebePoderDespromoverseAUno() {
        given(usuarios.contarActivosPorRol(RolVeedor.ADMIN)).willReturn(2L);
        elSujetoEs(cuenta(SUJETO_ID, "otro@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.ADMIN));

        Usuario despromovido = servicio.cambiarPermisos(
                SUJETO_ID, PermisosEfectivos.deRol(RolVeedor.VEEDOR), CONTEXTO);

        assertThat(despromovido.permisos().rol()).isEqualTo(RolVeedor.VEEDOR);
    }

    /** Cambiar de un ADMIN a otro ADMIN no reduce la cuenta de administradores. */
    @Test
    void debePermitirAjustarPermisosDelUnicoAdminSiSigueSiendoAdmin() {
        given(usuarios.contarActivosPorRol(RolVeedor.ADMIN)).willReturn(1L);
        elSujetoEs(cuenta(SUJETO_ID, "otro@ejemplo.org", EstadoCuenta.ACTIVA, RolVeedor.ADMIN));

        Usuario ajustado = servicio.cambiarPermisos(SUJETO_ID, new PermisosEfectivos(
                RolVeedor.ADMIN, Set.of(), Set.of(Permiso.REVISAR_INGESTA)), CONTEXTO);

        assertThat(ajustado.permisos().rol()).isEqualTo(RolVeedor.ADMIN);
    }

    @Test
    void reactivarNoDebeRevocarSesiones() {
        elSujetoEs(cuenta(SUJETO_ID, "ana@ejemplo.org", EstadoCuenta.SUSPENDIDA, RolVeedor.VEEDOR));

        assertThat(servicio.reactivar(SUJETO_ID, CONTEXTO).estado()).isEqualTo(EstadoCuenta.ACTIVA);
        verify(revocacion, never()).revocarSesionesAnterioresA(any(), any());
    }

    @Test
    void debeRechazarActuarSobreUnaCuentaQueNoExiste() {
        given(usuarios.buscarPorId(SUJETO_ID)).willReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatIllegalArgumentException()
                .isThrownBy(() -> servicio.suspender(SUJETO_ID, CONTEXTO));
    }

    @Test
    void debeExigirUnaSesionDeAdministrador() {
        assertThatIllegalStateException().isThrownBy(
                () -> servicio.suspender(SUJETO_ID, ContextoDeAccion.anonimo("10.0.0.1")));
    }
}
