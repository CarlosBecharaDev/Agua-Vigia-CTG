package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class EventoBitacoraMongoAdapter implements EventoBitacoraRepository {

    private final EventoBitacoraMongoRepository repositorio;

    public EventoBitacoraMongoAdapter(EventoBitacoraMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public EventoBitacora guardar(EventoBitacora evento) {
        EventoBitacoraDocumento documento = new EventoBitacoraDocumento();
        documento.setId(evento.id() != null ? evento.id().valor() : UUID.randomUUID().toString());
        documento.setTipo(evento.tipo().name());
        documento.setSectorId(evento.sectorId() != null ? evento.sectorId().valor() : null);
        documento.setCorteId(evento.corteId() != null ? evento.corteId().valor() : null);
        documento.setTimestamp(evento.timestamp());
        documento.setDescripcion(evento.descripcion());
        documento.setEstado(evento.estado() != null ? evento.estado().name() : null);
        documento.setUrlOriginal(evento.urlOriginal());
        documento.setImagenUrl(evento.imagenUrl());

        repositorio.save(documento);
        return evento;
    }

    /** Más recientes primero: el índice descendente sobre `timestamp` de IndicesMongo cubre el orden. */
    @Override
    public Pagina<EventoBitacora> listar(int pagina, int tamano) {
        Page<EventoBitacoraDocumento> resultado = repositorio.findAll(
                PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.DESC, "timestamp")));

        return new Pagina<>(
                resultado.getContent().stream().map(EventoBitacoraMongoAdapter::aDominio).toList(),
                pagina,
                tamano,
                resultado.getTotalElements());
    }

    private static EventoBitacora aDominio(EventoBitacoraDocumento documento) {
        return new EventoBitacora(
                new EventoId(documento.getId()),
                TipoEvento.valueOf(documento.getTipo()),
                documento.getSectorId() != null ? new SectorId(documento.getSectorId()) : null,
                documento.getCorteId() != null ? new CorteId(documento.getCorteId()) : null,
                documento.getTimestamp(),
                documento.getDescripcion(),
                documento.getEstado() != null ? EstadoServicio.valueOf(documento.getEstado()) : null,
                documento.getUrlOriginal(),
                documento.getImagenUrl());
    }
}
