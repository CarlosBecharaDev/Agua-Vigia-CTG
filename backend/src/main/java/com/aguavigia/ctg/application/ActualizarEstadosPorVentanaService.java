package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.in.ActualizarEstadosPorVentanaUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Barre las propuestas ya aprobadas y pone cada sector en el estado que le toca <b>ahora</b> según
 * la ventana que el boletín prometió.
 *
 * Es la mitad que faltaba del ciclo: la ingesta detecta y el veedor aprueba, pero entre el «se
 * suspende mañana de 9 a 6» y el momento en que eso ocurre pasan horas que nadie estaba mirando.
 *
 * No inventa nada. Solo aplica lo que la fuente ya declaró y un veedor ya aprobó: si la propuesta no
 * traía ventana, el sector no se toca. Y solo escribe cuando el estado cambia de verdad, para no
 * disparar correo, push y SSE en cada barrido.
 */
@Service
public class ActualizarEstadosPorVentanaService implements ActualizarEstadosPorVentanaUseCase {

    private static final Logger log = LoggerFactory.getLogger(ActualizarEstadosPorVentanaService.class);

    /**
     * Hasta un día después del fin prometido se sigue mirando la propuesta: es el margen para
     * devolver el barrio a CON_SERVICIO aunque el barrido no corriera justo al cerrarse la ventana.
     */
    private static final Duration MARGEN_TRAS_EL_FIN = Duration.ofDays(1);

    private final PropuestaIngestaRepository propuestas;
    private final SectorRepository sectores;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;

    public ActualizarEstadosPorVentanaService(PropuestaIngestaRepository propuestas,
                                               SectorRepository sectores,
                                               RegistrarEventoBitacoraUseCase registrarEvento,
                                               RelojPort reloj) {
        this.propuestas = propuestas;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
    }

    @Override
    public int aplicarVentanasVencidas() {
        Instant ahora = reloj.ahora();
        int cambiados = 0;

        for (PropuestaIngesta propuesta : propuestas
                .listarAprobadasConVentanaVigente(ahora.minus(MARGEN_TRAS_EL_FIN))) {

            EstadoServicio queCorresponde = propuesta.estadoVigenteEn(ahora);
            Sector sector = sectores.buscarPorId(propuesta.sectorId()).orElse(null);
            if (sector == null || sector.estadoActual() == queCorresponde) {
                continue;
            }

            sectores.guardar(sector.conEstado(queCorresponde));
            registrarEvento.registrar(EventoBitacoraFactory.detectadoPorIngesta(
                    propuesta.sectorId(), queCorresponde, propuesta.fuente(), ahora));
            cambiados++;

            log.info("Ventana declarada aplicada: '{}' pasa a {} (fuente: {})",
                    propuesta.sectorId().valor(), queCorresponde, propuesta.fuente());
        }

        return cambiados;
    }
}
