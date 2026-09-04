package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.RegistrarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.out.CifradorClavePort;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Registro abierto con dos frenos: el correo hay que probarlo, y un ADMIN tiene que aprobar. Sin
 * el segundo, "registro abierto" sería "cualquiera entra al panel de moderación".
 *
 * Si el correo ya tiene cuenta no se avisa a quien rellenó el formulario — se avisa al dueño de la
 * dirección, por correo. Así el formulario no sirve para averiguar qué correos están registrados, y
 * de paso el titular se entera de que alguien intentó usar el suyo.
 */
@Service
public class RegistrarUsuarioService implements RegistrarUsuarioUseCase {

    private final UsuarioRepository usuarios;
    private final CifradorClavePort cifrador;
    private final EmisorDeTokensDeCuenta emisorDeTokens;
    private final NotificacionCuentaPort notificaciones;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public RegistrarUsuarioService(UsuarioRepository usuarios,
                                   CifradorClavePort cifrador,
                                   EmisorDeTokensDeCuenta emisorDeTokens,
                                   NotificacionCuentaPort notificaciones,
                                   RegistroDeAuditoria auditoria,
                                   RelojPort reloj) {
        this.usuarios = usuarios;
        this.cifrador = cifrador;
        this.emisorDeTokens = emisorDeTokens;
        this.notificaciones = notificaciones;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public void registrar(CorreoElectronico correo, String nombre, ClaveEnClaro clave,
                          ContextoDeAccion contexto) {
        CorreoElectronico normalizado = correo.normalizado();

        var existente = usuarios.buscarPorCorreo(normalizado);
        if (existente.isPresent()) {
            notificaciones.avisarCambioDeAcceso(existente.get(),
                    "Alguien intentó registrarse con tu correo",
                    "Recibimos una solicitud de registro en AguaVigía con esta dirección, que ya "
                            + "tiene cuenta. No hicimos ningún cambio. Si fuiste tú y no recuerdas "
                            + "tu clave, usa la opción de restablecerla desde el ingreso del veedor.");
            return;
        }

        Usuario nuevo = usuarios.guardar(Usuario.registrado(
                new UsuarioId(UUID.randomUUID().toString()),
                normalizado,
                nombre.strip(),
                cifrador.cifrar(clave.valor()),
                reloj.ahora()));

        String token = emisorDeTokens.emitir(nuevo.id(), TipoTokenCuenta.VERIFICACION_CORREO);
        notificaciones.enviarVerificacionDeCorreo(nuevo, token);
        auditoria.registrar(AccionAuditada.CUENTA_REGISTRADA, nuevo,
                "Auto-registro; queda pendiente de verificar correo", contexto);
    }
}
