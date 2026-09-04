package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    private final CorteAguaRepository cortes;
    private final RelojPort reloj;

    public RevisarPropuestaIngestaService(PropuestaIngestaRepository propuestas,
                                           SectorRepository sectores,
                                           RegistrarEventoBitacoraUseCase registrarEvento,
                                           CorteAguaRepository cortes,
                                           RelojPort reloj) {
        this.propuestas = propuestas;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.cortes = cortes;
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
        if (propuesta.puedeFijarEstadoActual() && sector.estadoActual() != propuesta.estadoPropuesto()) {
            sectores.guardar(sector.conEstado(propuesta.estadoPropuesto()));
            registrarEvento.registrar(EventoBitacoraFactory.detectadoPorIngesta(
                    propuesta.sectorId(), sector.nombre(), propuesta.estadoPropuesto(),
                    propuesta.fuente(), propuesta.urlOriginal(), propuesta.imagenUrl(), propuesta.tituloOriginal(),
                    propuesta.momentoParaLaBitacora(reloj.ahora())));
        }

        registrarCorteDelBoletin(propuesta);

        return propuestas.guardar(propuesta.aprobar());
    }

    /**
     * M6/M7 — un boletín con ventana declarada es un corte, y sin corte no hay estadísticas: la
     * bitácora cuenta qué pasó, pero `sectoresMasAfectados` y `cortesPorDiaDeSemana` agregan sobre
     * la colección de cortes, que la ingesta nunca alimentaba.
     *
     * **No se fija `finReal`.** El boletín dice cuándo *prometieron* restablecer, no cuándo se
     * restableció de verdad. Rellenarlo con la promesa daría un Índice de Cumplimiento del 100%
     * permanente, que es justo la afirmación que este proyecto existe para poder contrastar. El
     * corte queda abierto hasta que alguien —consenso ciudadano o veedor— confirme la hora real.
     */
    private void registrarCorteDelBoletin(PropuestaIngesta propuesta) {
        if (propuesta.inicioDeclarado() == null || propuesta.finPrometido() == null) {
            return;
        }

        // Un boletín nombra muchos barrios y genera una propuesta por cada uno. El id se deriva del
        // boletín y su ventana para que todos caigan en el mismo corte, en vez de inflar la
        // estadística con un corte por barrio.
        CorteId id = idDelBoletin(propuesta);
        List<SectorId> sectores = cortes.buscarPorId(id)
                .map(CorteAgua::sectoresAfectados)
                .orElseGet(List::of);
        if (sectores.contains(propuesta.sectorId())) {
            return;
        }

        List<SectorId> ampliados = new ArrayList<>(sectores);
        ampliados.add(propuesta.sectorId());

        cortes.guardar(CorteAgua.builder()
                .id(id)
                .sectoresAfectados(ampliados)
                .inicio(propuesta.inicioDeclarado())
                .finPrometido(propuesta.finPrometido())
                .causa(propuesta.citaTextual() == null || propuesta.citaTextual().isBlank()
                        ? "Anuncio de " + propuesta.fuente()
                        : propuesta.citaTextual())
                .origen(OrigenCorte.INGESTA_IA)
                .estado(EstadoCorte.ANUNCIADO)
                .build());
    }

    private static CorteId idDelBoletin(PropuestaIngesta propuesta) {
        String semilla = propuesta.urlOriginal() + "|" + propuesta.inicioDeclarado() + "|" + propuesta.finPrometido();
        return new CorteId(UUID.nameUUIDFromBytes(semilla.getBytes(StandardCharsets.UTF_8)).toString());
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
