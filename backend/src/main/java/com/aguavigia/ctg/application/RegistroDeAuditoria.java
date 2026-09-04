package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.AuditoriaId;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.port.out.AuditoriaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Un solo punto por el que pasan todos los asientos de auditoría. Que sea uno importa: si cada
 * caso de uso armara su propio EventoAuditoria, bastaría con que uno olvidara el autor o la IP para
 * que la evidencia dejara de ser comparable, y eso no se nota hasta que hace falta consultarla.
 *
 * Un fallo al auditar se registra pero no propaga. Es una decisión incómoda y deliberada: si
 * escribir la auditoría pudiera tumbar la operación, un Mongo lento impediría suspender la cuenta
 * de alguien que está haciendo daño ahora mismo. Se prefiere la acción hecha y el asiento perdido
 * —con su log de error— a la acción bloqueada.
 */
@Component
public class RegistroDeAuditoria {

    private static final Logger log = LoggerFactory.getLogger(RegistroDeAuditoria.class);

    private final AuditoriaRepository auditoria;
    private final UsuarioRepository usuarios;
    private final RelojPort reloj;

    public RegistroDeAuditoria(AuditoriaRepository auditoria, UsuarioRepository usuarios, RelojPort reloj) {
        this.auditoria = auditoria;
        this.usuarios = usuarios;
        this.reloj = reloj;
    }

    public void registrar(AccionAuditada accion, Usuario sujeto, String detalle, ContextoDeAccion contexto) {
        Usuario autor = contexto.autorId() == null
                ? null
                : usuarios.buscarPorId(contexto.autorId()).orElse(null);
        registrarConAutor(accion, autor, sujeto, detalle, contexto);
    }

    public void registrarConAutor(AccionAuditada accion, Usuario autor, Usuario sujeto,
                                  String detalle, ContextoDeAccion contexto) {
        try {
            auditoria.registrar(new EventoAuditoria(
                    new AuditoriaId(UUID.randomUUID().toString()),
                    accion,
                    autor == null ? null : autor.id(),
                    autor == null ? null : autor.correo().valor(),
                    sujeto == null ? null : sujeto.id(),
                    sujeto == null ? null : sujeto.correo().valor(),
                    detalle,
                    contexto.ip(),
                    reloj.ahora()));
        } catch (RuntimeException noSePudoAuditar) {
            log.error("No se pudo registrar la auditoría de {} sobre {}", accion,
                    sujeto == null ? "(sin sujeto)" : sujeto.correo().valor(), noSePudoAuditar);
        }
    }
}
