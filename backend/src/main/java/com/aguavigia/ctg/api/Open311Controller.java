package com.aguavigia.ctg.api;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v2/requests.json")
public class Open311Controller {

    private final SectorRepository sectorRepository;

    public Open311Controller(SectorRepository sectorRepository) {
        this.sectorRepository = sectorRepository;
    }

    @GetMapping
    public List<Open311Response> getRequests() {
        return sectorRepository.listarTodos().stream()
                .filter(this::isActiveIssue)
                .map(s -> new Open311Response(
                        s.id().valor(),
                        "open",
                        "Problema de suministro (" + s.estadoActual().name() + ")",
                        s.nombre()
                ))
                .collect(Collectors.toList());
    }

    private boolean isActiveIssue(Sector s) {
        if (s.estadoActual() == null) {
            return false;
        }
        return s.estadoActual() != EstadoServicio.CON_SERVICIO;
    }

    public record Open311Response(
            String service_request_id,
            String status,
            String service_name,
            String address
    ) {}
}
