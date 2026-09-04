package com.aguavigia.ctg.api.dto;

import com.aguavigia.ctg.domain.EventoAuditoria;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Asiento de la bitacora de auditoria de cuentas: quien le hizo que a quien")
public record EventoAuditoriaRespuesta(
        String id,
        String accion,

        @Schema(description = "Nulo cuando actua el sistema o alguien sin sesion")
        String autorCorreo,

        String sujetoCorreo,
        String detalle,
        String ip,
        Instant ocurrioEn) {

    public static EventoAuditoriaRespuesta de(EventoAuditoria evento) {
        return new EventoAuditoriaRespuesta(
                evento.id().valor(),
                evento.accion().name(),
                evento.autorCorreo(),
                evento.sujetoCorreo(),
                evento.detalle(),
                evento.ip(),
                evento.ocurrioEn());
    }
}
