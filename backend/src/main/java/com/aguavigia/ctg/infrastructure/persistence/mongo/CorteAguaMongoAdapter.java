package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.AgregadoDuraciones;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.PuntoAgregadoMensual;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.util.Date;
import java.util.List;
import java.util.Optional;

/**
 * Adaptador de CorteAguaRepository sobre MongoDB (RF016-RF017).
 *
 * A diferencia de SectorMongoAdapter, aqui no hay que preservar campos ajenos al leer antes de
 * guardar: CorteAgua es dueño exclusivo de su documento, nadie mas lo siembra ni lo enriquece.
 */
@Component
public class CorteAguaMongoAdapter implements CorteAguaRepository {

    private final CorteAguaMongoRepository repositorio;
    private final MongoTemplate mongoTemplate;

    public CorteAguaMongoAdapter(CorteAguaMongoRepository repositorio, MongoTemplate mongoTemplate) {
        this.repositorio = repositorio;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Optional<CorteAgua> buscarPorId(CorteId id) {
        return repositorio.findById(id.valor()).map(CorteAguaMongoAdapter::aDominio);
    }

    @Override
    public List<CorteAgua> listarPorSector(SectorId sectorId) {
        return repositorio.findBySectoresAfectadosContaining(sectorId.valor()).stream()
                .map(CorteAguaMongoAdapter::aDominio)
                .toList();
    }

    @Override
    public List<CorteAgua> listarTodos() {
        return repositorio.findAll().stream()
                .map(CorteAguaMongoAdapter::aDominio)
                .toList();
    }

    @Override
    public CorteAgua guardar(CorteAgua corte) {
        CorteAguaDocumento documento = new CorteAguaDocumento();
        documento.setId(corte.id().valor());
        documento.setSectoresAfectados(corte.sectoresAfectados().stream().map(SectorId::valor).toList());
        documento.setInicio(corte.ventana().inicio());
        documento.setFinPrometido(corte.ventana().finPrometido());
        documento.setFinReal(corte.ventana().finReal());
        documento.setCausa(corte.causa());
        documento.setOrigen(corte.origen().name());
        documento.setEstado(corte.estado().name());

        repositorio.save(documento);
        return corte;
    }

    /**
     * `estado-del-backend.md` #6.1: `listarTodos()` para calcular el índice global traía todos los
     * cortes cerrados a memoria — hoy acotado por el volumen real, pero incorrecto si el histórico
     * crece. La suma vive en Mongo; `CalcularCumplimientoService` solo calcula el porcentaje sobre
     * los dos totales.
     */
    @Override
    public AgregadoDuraciones agregarCerrados(SectorId sectorId) {
        Aggregation pipeline = Aggregation.newAggregation(
                matchCerrados(sectorId, null, null),
                agruparTotal());

        AggregationResults<Document> resultados =
                mongoTemplate.aggregate(pipeline, CorteAguaDocumento.class, Document.class);
        Document total = resultados.getUniqueMappedResult();
        return total == null ? AgregadoDuraciones.vacio() : aAgregado(total);
    }

    /**
     * Mismo principio que {@link #agregarCerrados}, agrupado por mes con `$dateToString` en
     * `America/Bogota` (RF024: el mes se decide en hora de Cartagena, no en UTC). El formato
     * "%Y-%m" ordena cronológicamente como texto y `YearMonth.parse` lo reconstruye tal cual.
     */
    @Override
    public List<PuntoAgregadoMensual> agregarCerradosPorMes(SectorId sectorId, Instant desde, Instant hasta) {
        Aggregation pipeline = Aggregation.newAggregation(
                matchCerrados(sectorId, desde, hasta),
                agruparPorMes(),
                Aggregation.sort(Sort.Direction.ASC, "_id"));

        AggregationResults<Document> resultados =
                mongoTemplate.aggregate(pipeline, CorteAguaDocumento.class, Document.class);
        return resultados.getMappedResults().stream()
                .map(doc -> new PuntoAgregadoMensual(YearMonth.parse(doc.getString("_id")), aAgregado(doc)))
                .toList();
    }

    private static AggregationOperation matchCerrados(SectorId sectorId, Instant desde, Instant hasta) {
        // estaCerrada() en el dominio es exactamente esto: finReal != null. Ningún estado.name()
        // adicional decide "cerrado" — replicar solo esa condición evita que ambos criterios diverjan.
        Document finReal = new Document("$ne", null);
        if (desde != null) {
            finReal.append("$gte", Date.from(desde));
        }
        if (hasta != null) {
            finReal.append("$lte", Date.from(hasta));
        }

        Document filtro = new Document("finReal", finReal);
        if (sectorId != null) {
            // sectoresAfectados es un arreglo; comparar contra un escalar es "el arreglo lo contiene".
            filtro.append("sectoresAfectados", sectorId.valor());
        }

        return context -> new Document("$match", filtro);
    }

    private static AggregationOperation agruparTotal() {
        return context -> new Document("$group", camposDeSuma(new Document("_id", null)));
    }

    private static AggregationOperation agruparPorMes() {
        Document mesEnCartagena = new Document("$dateToString", new Document("format", "%Y-%m")
                .append("date", "$finReal")
                .append("timezone", "America/Bogota"));
        return context -> new Document("$group", camposDeSuma(new Document("_id", mesEnCartagena)));
    }

    /** $subtract entre dos fechas da milisegundos — el mismo operador que ya usa EstadisticasMongoAdapter. */
    private static Document camposDeSuma(Document idDelGrupo) {
        return idDelGrupo
                .append("milisPrometidos", new Document("$sum",
                        new Document("$subtract", List.of("$finPrometido", "$inicio"))))
                .append("milisReales", new Document("$sum",
                        new Document("$subtract", List.of("$finReal", "$inicio"))))
                .append("cantidad", new Document("$sum", 1));
    }

    private static AgregadoDuraciones aAgregado(Document doc) {
        long milisPrometidos = ((Number) doc.get("milisPrometidos")).longValue();
        long milisReales = ((Number) doc.get("milisReales")).longValue();
        long cantidad = ((Number) doc.get("cantidad")).longValue();
        return new AgregadoDuraciones(Duration.ofMillis(milisPrometidos), Duration.ofMillis(milisReales), cantidad);
    }

    private static CorteAgua aDominio(CorteAguaDocumento documento) {
        try {
            return CorteAgua.builder()
                    .id(new CorteId(documento.getId()))
                    .sectoresAfectados(documento.getSectoresAfectados().stream().map(SectorId::new).toList())
                    .inicio(documento.getInicio())
                    .finPrometido(documento.getFinPrometido())
                    .finReal(documento.getFinReal())
                    .causa(documento.getCausa())
                    .origen(OrigenCorte.valueOf(documento.getOrigen()))
                    .estado(EstadoCorte.valueOf(documento.getEstado()))
                    .build();
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw new IllegalStateException(
                    "Corte '" + documento.getId() + "' persistido con datos inconsistentes", e);
        }
    }
}
