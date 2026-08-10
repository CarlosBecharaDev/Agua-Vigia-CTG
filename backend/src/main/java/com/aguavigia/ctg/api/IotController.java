package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.IotPresionRequest;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/iot")
public class IotController {

    private final RegistrarReporteUseCase registrarReporte;

    @Value("${aguavigia.iot.key:12345}")
    private String iotKey;

    public IotController(RegistrarReporteUseCase registrarReporte) {
        this.registrarReporte = registrarReporte;
    }

    @PostMapping("/presion")
    public ResponseEntity<Void> reportarPresion(
            @RequestHeader(value = "X-IoT-Key", required = false) String key,
            @RequestBody IotPresionRequest request) {

        if (key == null || !key.equals(iotKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (request.presionPsi() != null && request.presionPsi() < 15.0) {
            Coordenada coordenada = null;
            if (request.coordenada() != null && request.coordenada().lat() != null && request.coordenada().lon() != null) {
                coordenada = new Coordenada(request.coordenada().lat(), request.coordenada().lon());
            }

            SectorId sectorId = new SectorId("S-001");
            HuellaDispositivo huella = new HuellaDispositivo("IoT-" + request.sensorId());

            registrarReporte.registrar(sectorId, TipoReporte.PRESION_BAJA, coordenada, huella);
        }

        return ResponseEntity.ok().build();
    }
}
