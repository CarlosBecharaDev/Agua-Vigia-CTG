package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class ReporteCiudadanoMongoAdapter implements ReporteCiudadanoRepository {

    private final ReporteCiudadanoMongoRepository repositorio;
    private final RelojPort reloj;

    public ReporteCiudadanoMongoAdapter(ReporteCiudadanoMongoRepository repositorio, RelojPort reloj) {
        this.repositorio = repositorio;
        this.reloj = reloj;
    }

    @Override
    public ReporteCiudadano guardar(ReporteCiudadano reporte) {
        ReporteCiudadanoDocumento documento = new ReporteCiudadanoDocumento();
        documento.setId(reporte.id().valor());
        documento.setSectorId(reporte.sectorId().valor());
        documento.setTipo(reporte.tipo().name());
        if (reporte.coordenada() != null) {
            documento.setLatitud(reporte.coordenada().latitud());
            documento.setLongitud(reporte.coordenada().longitud());
        }
        documento.setHuella(reporte.huella().hash());
        documento.setTimestamp(reporte.timestamp());
        documento.setEstadoModeracion(reporte.estadoModeracion().name());
        documento.setFotoUrl(reporte.fotoUrl());
        documento.setHuellasConfirmacion(reporte.huellasConfirmacion());

        repositorio.save(documento);
        return reporte;
    }

    @Override
    public List<ReporteCiudadano> listarRecientesPorSector(SectorId sectorId, Duration ventana) {
        var desde = reloj.ahora().minus(ventana);
        return repositorio.findBySectorIdAndTimestampGreaterThanEqualAndEstadoModeracionNot(
                        sectorId.valor(), desde, EstadoModeracion.DESCARTADO.name()).stream()
                .map(ReporteCiudadanoMongoAdapter::aDominio)
                .toList();
    }

    @Override
    public long contarRecientesPorSectorYDispositivo(SectorId sectorId, Duration ventana, HuellaDispositivo huella) {
        var desde = reloj.ahora().minus(ventana);
        return repositorio.countBySectorIdAndTimestampGreaterThanEqualAndHuella(
                sectorId.valor(), desde, huella.hash());
    }

    @Override
    public Optional<ReporteCiudadano> buscarPorId(ReporteId id) {
        return repositorio.findById(id.valor()).map(ReporteCiudadanoMongoAdapter::aDominio);
    }

    /** Más antiguos primero: la cola de moderación se atiende en orden de llegada. */
    @Override
    public Pagina<ReporteCiudadano> listarPendientes(int pagina, int tamano) {
        Page<ReporteCiudadanoDocumento> resultado = repositorio.findPendientesIncluyendoNulo(
                EstadoModeracion.PENDIENTE.name(),
                PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.ASC, "timestamp")));

        return new Pagina<>(
                resultado.getContent().stream().map(ReporteCiudadanoMongoAdapter::aDominio).toList(),
                pagina,
                tamano,
                resultado.getTotalElements());
    }

    @Override
    public Set<String> listarNombresDeFotoReferenciados() {
        return repositorio.findByFotoUrlIsNotNull().stream()
                .map(ReporteCiudadanoDocumento::getFotoUrl)
                .map(ReporteCiudadanoMongoAdapter::nombreDeArchivo)
                .collect(Collectors.toSet());
    }

    @Override
    public List<ReporteCiudadano> listarConFotoAnterioresA(Instant limite) {
        return repositorio.findByFotoUrlIsNotNullAndTimestampBefore(limite).stream()
                .map(ReporteCiudadanoMongoAdapter::aDominio)
                .toList();
    }

    private static String nombreDeArchivo(String fotoUrl) {
        int barra = fotoUrl.lastIndexOf('/');
        return barra >= 0 ? fotoUrl.substring(barra + 1) : fotoUrl;
    }

    private static ReporteCiudadano aDominio(ReporteCiudadanoDocumento documento) {
        Coordenada coordenada = documento.getLatitud() != null
                ? new Coordenada(documento.getLatitud(), documento.getLongitud())
                : null;
        // Nulo en documentos sembrados antes de RF018 (ADR-023): se tratan como PENDIENTE, no como
        // ya moderados — un reporte viejo sin decision del veedor sigue siendo candidato.
        EstadoModeracion estado = documento.getEstadoModeracion() != null
                ? EstadoModeracion.valueOf(documento.getEstadoModeracion())
                : EstadoModeracion.PENDIENTE;
        java.util.Set<String> confirmaciones = documento.getHuellasConfirmacion() != null 
                ? documento.getHuellasConfirmacion() 
                : java.util.Collections.emptySet();
        return new ReporteCiudadano(
                new ReporteId(documento.getId()),
                new SectorId(documento.getSectorId()),
                TipoReporte.valueOf(documento.getTipo()),
                coordenada,
                new HuellaDispositivo(documento.getHuella()),
                documento.getTimestamp(),
                estado,
                documento.getFotoUrl(),
                confirmaciones);
    }
}
