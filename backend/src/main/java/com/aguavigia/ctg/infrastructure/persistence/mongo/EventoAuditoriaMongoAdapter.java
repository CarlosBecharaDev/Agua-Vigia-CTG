package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.AuditoriaId;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.AuditoriaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class EventoAuditoriaMongoAdapter implements AuditoriaRepository {

    private final EventoAuditoriaMongoRepository repositorio;

    public EventoAuditoriaMongoAdapter(EventoAuditoriaMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public EventoAuditoria registrar(EventoAuditoria evento) {
        EventoAuditoriaDocumento documento = new EventoAuditoriaDocumento();
        documento.setId(evento.id().valor());
        documento.setAccion(evento.accion().name());
        documento.setAutorId(evento.autorId() == null ? null : evento.autorId().valor());
        documento.setAutorCorreo(evento.autorCorreo());
        documento.setSujetoId(evento.sujetoId() == null ? null : evento.sujetoId().valor());
        documento.setSujetoCorreo(evento.sujetoCorreo());
        documento.setDetalle(evento.detalle());
        documento.setIp(evento.ip());
        documento.setOcurrioEn(evento.ocurrioEn());

        repositorio.save(documento);
        return evento;
    }

    @Override
    public Pagina<EventoAuditoria> listar(int pagina, int tamano) {
        Page<EventoAuditoriaDocumento> resultado = repositorio.findAll(
                PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.DESC, "ocurrioEn")));

        return new Pagina<>(
                resultado.getContent().stream().map(EventoAuditoriaMongoAdapter::aDominio).toList(),
                pagina,
                tamano,
                resultado.getTotalElements());
    }

    private static EventoAuditoria aDominio(EventoAuditoriaDocumento documento) {
        return new EventoAuditoria(
                new AuditoriaId(documento.getId()),
                AccionAuditada.valueOf(documento.getAccion()),
                documento.getAutorId() == null ? null : new UsuarioId(documento.getAutorId()),
                documento.getAutorCorreo(),
                documento.getSujetoId() == null ? null : new UsuarioId(documento.getSujetoId()),
                documento.getSujetoCorreo(),
                documento.getDetalle(),
                documento.getIp(),
                documento.getOcurrioEn());
    }
}
