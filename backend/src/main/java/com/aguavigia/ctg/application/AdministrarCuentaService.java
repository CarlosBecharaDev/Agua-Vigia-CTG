package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.AdministrarCuentaUseCase;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

/**
 * Lo que un ADMIN puede hacerle a una cuenta ajena. Tres guardas atraviesan todas las acciones y
 * por eso viven juntas:
 *
 * - **Nadie se administra a sí mismo.** Un ADMIN que se suspende o se quita GESTIONAR_USUARIOS se
 *   deja fuera sin manera de volver, y quien se aprueba a sí mismo convierte el registro abierto en
 *   una puerta directa al panel.
 * - **Siempre queda un ADMIN activo.** Suspender o despromover al último deja el sistema sin nadie
 *   capaz de otorgar permisos: no es un error recuperable desde la aplicación, hay que ir a Mongo
 *   a mano. Se rechaza antes de que ocurra.
 * - **Todo cambio de acceso revoca las sesiones vivas de la persona afectada.** Sin esto, suspender
 *   a alguien no lo saca: su token sigue firmado y válido hasta 8 horas más (RNF011).
 */
@Service
public class AdministrarCuentaService implements AdministrarCuentaUseCase {

    private final UsuarioRepository usuarios;
    private final RevocacionSesionPort revocacion;
    private final NotificacionCuentaPort notificaciones;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public AdministrarCuentaService(UsuarioRepository usuarios,
                                    RevocacionSesionPort revocacion,
                                    NotificacionCuentaPort notificaciones,
                                    RegistroDeAuditoria auditoria,
                                    RelojPort reloj) {
        this.usuarios = usuarios;
        this.revocacion = revocacion;
        this.notificaciones = notificaciones;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public Usuario aprobar(UsuarioId sujetoId, PermisosEfectivos permisos, ContextoDeAccion contexto) {
        Usuario autor = autor(contexto);
        Usuario sujeto = sujeto(sujetoId, autor);

        Usuario aprobado = usuarios.guardar(sujeto.aprobar(permisos, reloj.ahora()));
        notificaciones.avisarCambioDeAcceso(aprobado, "Tu cuenta de AguaVigía ya está activa",
                "Un administrador aprobó tu acceso con el rol " + permisos.rol()
                        + ". Ya puedes entrar al panel del veedor.");
        auditoria.registrarConAutor(AccionAuditada.CUENTA_APROBADA, autor, aprobado,
                "Aprobada con rol " + permisos.rol() + " y permisos " + aprobado.permisosEfectivos(),
                contexto);
        return aprobado;
    }

    @Override
    public Usuario rechazar(UsuarioId sujetoId, ContextoDeAccion contexto) {
        Usuario autor = autor(contexto);
        Usuario sujeto = sujeto(sujetoId, autor);

        Usuario rechazado = usuarios.guardar(sujeto.rechazar(reloj.ahora()));
        revocacion.revocarSesionesAnterioresA(rechazado.id(), reloj.ahora());
        notificaciones.avisarCambioDeAcceso(rechazado, "Tu solicitud de acceso a AguaVigía",
                "Un administrador no aprobó tu solicitud de acceso al panel del veedor.");
        auditoria.registrarConAutor(AccionAuditada.CUENTA_RECHAZADA, autor, rechazado,
                "Solicitud de acceso denegada", contexto);
        return rechazado;
    }

    @Override
    public Usuario suspender(UsuarioId sujetoId, ContextoDeAccion contexto) {
        Usuario autor = autor(contexto);
        Usuario sujeto = sujeto(sujetoId, autor);
        exigirQueQuedeUnAdministrador(sujeto, null);

        Usuario suspendido = usuarios.guardar(sujeto.suspender(reloj.ahora()));
        revocacion.revocarSesionesAnterioresA(suspendido.id(), reloj.ahora());
        notificaciones.avisarCambioDeAcceso(suspendido, "Tu acceso a AguaVigía quedó suspendido",
                "Un administrador suspendió tu cuenta. Si crees que es un error, contáctalo.");
        auditoria.registrarConAutor(AccionAuditada.CUENTA_SUSPENDIDA, autor, suspendido,
                "Cuenta suspendida y sesiones revocadas", contexto);
        return suspendido;
    }

    @Override
    public Usuario reactivar(UsuarioId sujetoId, ContextoDeAccion contexto) {
        Usuario autor = autor(contexto);
        Usuario sujeto = sujeto(sujetoId, autor);

        Usuario reactivado = usuarios.guardar(sujeto.reactivar(reloj.ahora()));
        notificaciones.avisarCambioDeAcceso(reactivado, "Tu acceso a AguaVigía se restableció",
                "Un administrador reactivó tu cuenta. Ya puedes volver a entrar al panel.");
        auditoria.registrarConAutor(AccionAuditada.CUENTA_REACTIVADA, reactivado, reactivado,
                "Cuenta reactivada por " + autor.correo().valor(), contexto);
        return reactivado;
    }

    @Override
    public Usuario cambiarPermisos(UsuarioId sujetoId, PermisosEfectivos permisos, ContextoDeAccion contexto) {
        Usuario autor = autor(contexto);
        Usuario sujeto = sujeto(sujetoId, autor);
        exigirQueQuedeUnAdministrador(sujeto, permisos.rol());

        Usuario actualizado = usuarios.guardar(sujeto.cambiarPermisos(permisos, reloj.ahora()));

        // Revocar también cuando los permisos se amplían, no solo cuando se recortan: el token
        // lleva los permisos dentro, así que una sesión abierta seguiría usando los viejos. Rehacer
        // la sesión es la única forma de que el cambio valga ya, en las dos direcciones.
        revocacion.revocarSesionesAnterioresA(actualizado.id(), reloj.ahora());
        notificaciones.avisarCambioDeAcceso(actualizado, "Cambiaron tus permisos en AguaVigía",
                "Un administrador actualizó tu rol a " + permisos.rol()
                        + ". Vuelve a iniciar sesión para que aplique.");
        auditoria.registrarConAutor(AccionAuditada.PERMISOS_CAMBIADOS, autor, actualizado,
                "De " + sujeto.permisosEfectivos() + " a " + actualizado.permisosEfectivos(), contexto);
        return actualizado;
    }

    private Usuario autor(ContextoDeAccion contexto) {
        if (contexto.autorId() == null) {
            throw new IllegalStateException("Esta acción exige una sesión de administrador");
        }
        return usuarios.buscarPorId(contexto.autorId())
                .orElseThrow(() -> new IllegalStateException("La sesión que administra ya no existe"));
    }

    private Usuario sujeto(UsuarioId sujetoId, Usuario autor) {
        if (autor.id().equals(sujetoId)) {
            throw new IllegalStateException(
                    "Un administrador no puede aplicarse a sí mismo cambios de acceso. "
                            + "Pídeselo a otro administrador.");
        }
        return usuarios.buscarPorId(sujetoId)
                .orElseThrow(() -> new IllegalArgumentException("No existe esa cuenta"));
    }

    /** `rolDestino` nulo significa que la cuenta va a dejar de estar activa (suspensión). */
    private void exigirQueQuedeUnAdministrador(Usuario sujeto, RolVeedor rolDestino) {
        boolean eraAdminActivo = sujeto.permisos().rol() == RolVeedor.ADMIN
                && sujeto.estado().permiteIniciarSesion();
        boolean seguiraSiendoAdmin = rolDestino == RolVeedor.ADMIN;

        if (eraAdminActivo && !seguiraSiendoAdmin && usuarios.contarActivosPorRol(RolVeedor.ADMIN) <= 1) {
            throw new IllegalStateException(
                    "Es el único administrador activo. Nombra otro antes de quitarle el acceso, "
                            + "o el sistema se queda sin nadie que pueda otorgar permisos.");
        }
    }
}
