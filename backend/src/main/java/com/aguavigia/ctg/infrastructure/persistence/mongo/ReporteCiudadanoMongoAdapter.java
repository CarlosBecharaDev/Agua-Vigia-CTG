package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

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

        repositorio.save(documento);
        return reporte;
    }

    @Override
    public List<ReporteCiudadano> listarRecientesPorSector(SectorId sectorId, Duration ventana) {
        var desde = reloj.ahora().minus(ventana);
        return repositorio.findBySectorIdAndTimestampGreaterThanEqual(sectorId.valor(), desde).stream()
                .map(ReporteCiudadanoMongoAdapter::aDominio)
                .toList();
    }

    @Override
    public Optional<ReporteCiudadano> buscarPorId(ReporteId id) {
        return repositorio.findById(id.valor()).map(ReporteCiudadanoMongoAdapter::aDominio);
    }

    @Override
    public List<ReporteCiudadano> listarPendientes() {
        return repositorio.findPendientesIncluyendoNulo(EstadoModeracion.PENDIENTE.name()).stream()
                .map(ReporteCiudadanoMongoAdapter::aDominio)
                .toList();
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
        return new ReporteCiudadano(
                new ReporteId(documento.getId()),
                new SectorId(documento.getSectorId()),
                TipoReporte.valueOf(documento.getTipo()),
                coordenada,
                new HuellaDispositivo(documento.getHuella()),
                documento.getTimestamp(),
                estado);
    }
}
