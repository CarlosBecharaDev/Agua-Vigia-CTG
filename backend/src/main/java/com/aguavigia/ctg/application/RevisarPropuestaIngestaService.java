package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

/**
 * M9 + M5 — el punto donde una propuesta automatizada se convierte (o no) en dato público.
 *
 * Aprobar es lo único que mueve el mapa: guarda el estado en el sector, lo que publica
 * `SectorActualizadoEvent` y con eso salen correo, push y SSE, y anexa el evento a la bitácora
 * (RF026). Descartar no toca nada: la propuesta se archiva, no se borra — la bitácora es de solo
 * anexado y la cola de revisión debe poder auditarse.
 */
@Service
public class RevisarPropuestaIngestaService implements RevisarPropuestaIngestaUseCase {

    private final PropuestaIngestaRepository propuestas;
    private final SectorRepository sectores;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;

    public RevisarPropuestaIngestaService(PropuestaIngestaRepository propuestas,
                                           SectorRepository sectores,
                                           RegistrarEventoBitacoraUseCase registrarEvento,
                                           RelojPort reloj) {
        this.propuestas = propuestas;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
    }

    @Override
    public PropuestaIngesta aprobar(PropuestaId id) {
        PropuestaIngesta propuesta = buscarOLanzar(id);

        Sector sector = sectores.buscarPorId(propuesta.sectorId())
                .orElseThrow(() -> new IllegalStateException(
                        "El sector '" + propuesta.sectorId().valor() + "' de la propuesta ya no existe"));

        // Aprobar una propuesta cuyo estado ya rige no debe anexar un evento nuevo a la bitacora:
        // RF028 prohibe editarla, pero duplicar un evento identico tampoco la hace mas veraz.
        if (sector.estadoActual() != propuesta.estadoPropuesto()) {
            sectores.guardar(sector.conEstado(propuesta.estadoPropuesto()));
            registrarEvento.registrar(EventoBitacoraFactory.detectadoPorIngesta(
                    propuesta.sectorId(), propuesta.estadoPropuesto(), propuesta.fuente(), reloj.ahora()));
        }

        return propuestas.guardar(propuesta.aprobar());
    }

    @Override
    public PropuestaIngesta descartar(PropuestaId id) {
        return propuestas.guardar(buscarOLanzar(id).descartar());
    }

    private PropuestaIngesta buscarOLanzar(PropuestaId id) {
        return propuestas.buscarPorId(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe la propuesta '" + id.valor() + "'"));
    }
}
