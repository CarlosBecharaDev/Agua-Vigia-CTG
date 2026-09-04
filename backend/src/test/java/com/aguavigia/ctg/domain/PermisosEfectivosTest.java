package com.aguavigia.ctg.domain;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class PermisosEfectivosTest {

    @Test
    void sinAjustesDebeDevolverExactamenteLosPermisosDelRol() {
        PermisosEfectivos permisos = PermisosEfectivos.deRol(RolVeedor.VEEDOR);

        assertThat(permisos.resolver())
                .containsExactlyInAnyOrderElementsOf(RolVeedor.VEEDOR.permisosBase());
    }

    @Test
    void unPermisoConcedidoAManoDebeSumarseAlRol() {
        PermisosEfectivos permisos = new PermisosEfectivos(
                RolVeedor.OBSERVADOR, Set.of(Permiso.MODERAR_REPORTES), Set.of());

        assertThat(permisos.resolver()).contains(Permiso.VER_PANEL, Permiso.MODERAR_REPORTES);
        assertThat(permisos.incluye(Permiso.MODERAR_REPORTES)).isTrue();
    }

    @Test
    void unPermisoRevocadoAManoDebeQuitarseAunqueElRolLoTenga() {
        PermisosEfectivos permisos = new PermisosEfectivos(
                RolVeedor.VEEDOR, Set.of(), Set.of(Permiso.GESTIONAR_CORTES));

        assertThat(permisos.incluye(Permiso.GESTIONAR_CORTES)).isFalse();
        assertThat(permisos.incluye(Permiso.MODERAR_REPORTES)).isTrue();
    }

    /**
     * No se elige un ganador en silencio: una configuración así siempre es un error de quien la
     * escribió, y adivinar la intención es como se acaba concediendo acceso que nadie recuerda dar.
     */
    @Test
    void debeRechazarUnPermisoConcedidoYRevocadoALaVez() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new PermisosEfectivos(RolVeedor.VEEDOR,
                        Set.of(Permiso.MODERAR_REPORTES), Set.of(Permiso.MODERAR_REPORTES)))
                .withMessageContaining("MODERAR_REPORTES");
    }

    /** La única puerta que el modelo no permite cerrar: sin ella, un ADMIN quedaría fuera para siempre. */
    @Test
    void debeRechazarQueSeRevoqueConfigurarSegundoFactor() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new PermisosEfectivos(RolVeedor.ADMIN,
                        Set.of(), Set.of(Permiso.CONFIGURAR_SEGUNDO_FACTOR)));
    }

    @Test
    void debeExigirUnRol() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new PermisosEfectivos(null, Set.of(), Set.of()));
    }

    @Test
    void elAdminDebeTenerTodosLosPermisos() {
        assertThat(PermisosEfectivos.deRol(RolVeedor.ADMIN).resolver())
                .containsExactlyInAnyOrder(Permiso.values());
    }

    @Test
    void soloElAdminDebeExigirSegundoFactor() {
        assertThat(RolVeedor.ADMIN.exigeSegundoFactor()).isTrue();
        assertThat(RolVeedor.VEEDOR.exigeSegundoFactor()).isFalse();
        assertThat(RolVeedor.OBSERVADOR.exigeSegundoFactor()).isFalse();
    }

    /** El observador acompaña la moderación; no debe poder ejecutarla. */
    @Test
    void elObservadorNoDebePoderActuarSobreNada() {
        Set<Permiso> permisos = RolVeedor.OBSERVADOR.permisosBase();

        assertThat(permisos).containsExactlyInAnyOrder(
                Permiso.VER_PANEL, Permiso.CONFIGURAR_SEGUNDO_FACTOR);
    }

    @Test
    void ningunRolSalvoElAdminDebePoderGestionarUsuarios() {
        assertThat(RolVeedor.VEEDOR.permisosBase()).doesNotContain(Permiso.GESTIONAR_USUARIOS);
        assertThat(RolVeedor.OBSERVADOR.permisosBase()).doesNotContain(Permiso.GESTIONAR_USUARIOS);
        assertThat(RolVeedor.ADMIN.permisosBase()).contains(Permiso.GESTIONAR_USUARIOS);
    }
}
