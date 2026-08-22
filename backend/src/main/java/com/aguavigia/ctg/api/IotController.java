package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.IotPresionRequest;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * M13 — telemetría IoT pasiva (presión de red). Reusa RegistrarReporteUseCase: un sensor que
 * reporta presión baja es, para el dominio, un reporte más — con su propia huella de dispositivo.
 */
@RestController
@RequestMapping("/api/iot")
public class IotController {

    private final RegistrarReporteUseCase registrarReporte;
    private final SectorRepository sectores;

    /**
     * Sin default: a diferencia de JWT_SECRET/VEEDOR_PASSWORD_HASH (mismo patrón), una clave
     * adivinable aquí permite inyectar reportes anónimos que alteran el consenso público.
     */
    @Value("${aguavigia.iot.key:}")
    private String iotKey;

    public IotController(RegistrarReporteUseCase registrarReporte, SectorRepository sectores) {
        this.registrarReporte = registrarReporte;
        this.sectores = sectores;
    }

    @PostMapping("/presion")
    public ResponseEntity<Void> reportarPresion(
            @RequestHeader(value = "X-IoT-Key", required = false) String key,
            @RequestBody IotPresionRequest request) {

        if (iotKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (key == null || !constantTimeEquals(key, iotKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (request.sectorId() == null || request.sectorId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        SectorId sectorId = new SectorId(request.sectorId());
        if (sectores.buscarPorId(sectorId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (request.presionPsi() != null && request.presionPsi() < 15.0) {
            Coordenada coordenada = null;
            if (request.coordenada() != null && request.coordenada().lat() != null && request.coordenada().lon() != null) {
                coordenada = new Coordenada(request.coordenada().lat(), request.coordenada().lon());
            }

            HuellaDispositivo huella = new HuellaDispositivo("IoT-" + request.sensorId());

            registrarReporte.registrar(sectorId, TipoReporte.PRESION_BAJA, coordenada, huella);
        }

        return ResponseEntity.ok().build();
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
