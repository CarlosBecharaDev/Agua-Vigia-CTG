package com.aguavigia.ctg.api;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * M12 — RF039: datos abiertos bajo el estándar Open311 GeoReport v2.
 *
 * Expone **el estado agregado por sector**, no cada reporte ciudadano individual, y eso es una
 * decisión de privacidad, no una simplificación (`ADR-026`): un reporte trae la coordenada que el
 * vecino autorizó a compartir, y publicar esa serie de puntos en un endpoint abierto permitiría
 * inferir domicilios. RNF008 prohíbe almacenar datos personales del reportante; publicarlos
 * agregados por barrio conserva la utilidad cívica sin exponer a nadie.
 *
 * Por lo mismo `lat`/`long` viajan ausentes: el estándar los admite opcionales cuando hay
 * `address`, y aquí la unidad geográfica es el barrio entero, no un punto.
 */
@Tag(name = "Open311", description = "API abierta bajo el estándar Open311 GeoReport v2 (RF039)")
@RestController
@RequestMapping(value = "/api/v2/requests.json", produces = MediaType.APPLICATION_JSON_VALUE)
public class Open311Controller {

    /** Código de servicio del estándar. Uno solo: esta plataforma reporta un único tipo de problema. */
    private static final String CODIGO_DE_SERVICIO = "AGUA-001";

    private final SectorRepository sectorRepository;

    public Open311Controller(SectorRepository sectorRepository) {
        this.sectorRepository = sectorRepository;
    }

    @Operation(summary = "Listar los sectores con el servicio afectado, en formato Open311",
            description = """
                    Un `service_request` por sector que no está en CON_SERVICIO. Los sectores sin
                    estado verificado no aparecen: publicar "sin novedad" sin haberlo comprobado es
                    el falso positivo que ADR-014 evita.""")
    @ApiResponse(responseCode = "200", description = "Listado generado")
    @GetMapping
    public List<Open311Response> getRequests() {
        return sectorRepository.listarTodos().stream()
                .filter(this::isActiveIssue)
                .map(s -> new Open311Response(
                        s.id().valor(),
                        "open",
                        CODIGO_DE_SERVICIO,
                        "Problema de suministro (" + s.estadoActual().name() + ")",
                        descripcionDe(s),
                        s.nombre(),
                        s.estadoActualizadoEn(),
                        s.estadoActualizadoEn()
                ))
                .toList();
    }

    private boolean isActiveIssue(Sector s) {
        if (s.estadoActual() == null) {
            return false;
        }
        return s.estadoActual() != EstadoServicio.CON_SERVICIO;
    }

    private static String descripcionDe(Sector sector) {
        String situacion = switch (sector.estadoActual()) {
            case SIN_SERVICIO -> "No hay servicio de agua";
            case PRESION_BAJA -> "El agua llega con poca presión";
            case CORTE_PROGRAMADO -> "Hay un corte de agua anunciado";
            case CON_SERVICIO -> "El servicio funciona con normalidad";
        };
        return situacion + " en " + sector.nombre() + ", Cartagena de Indias.";
    }

    /**
     * Los nombres de campo son los del estándar (snake_case en inglés) y por eso rompen la
     * convención del resto de la API: un consumidor de Open311 espera exactamente estas claves.
     */
    @Schema(description = "service_request de Open311 GeoReport v2")
    public record Open311Response(
            String service_request_id,
            @Schema(description = "open o closed", example = "open")
            String status,
            @Schema(description = "Código del tipo de servicio", example = "AGUA-001")
            String service_code,
            String service_name,
            String description,
            @Schema(description = "Nombre del barrio. La unidad geográfica es el sector, no un punto (ADR-026)")
            String address,
            @Schema(description = "Cuándo se registró el estado actual del sector", nullable = true)
            Instant requested_datetime,
            @Schema(description = "Igual a requested_datetime: el estado del sector es su propia actualización", nullable = true)
            Instant updated_datetime
    ) {}
}
