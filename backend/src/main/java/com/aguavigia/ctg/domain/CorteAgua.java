package com.aguavigia.ctg.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Se construye solo con Builder: la invariante finPrometido > inicio la impone VentanaTiempo,
 * y aquí no hay forma de terminar el objeto sin pasar por ella.
 */
public final class CorteAgua {

    private final CorteId id;
    private final List<SectorId> sectoresAfectados;
    private final VentanaTiempo ventana;
    private final String causa;
    private final OrigenCorte origen;
    private final EstadoCorte estado;

    private CorteAgua(Builder builder, VentanaTiempo ventana) {
        this.id = builder.id;
        this.sectoresAfectados = List.copyOf(builder.sectoresAfectados);
        this.ventana = ventana;
        this.causa = builder.causa;
        this.origen = builder.origen;
        this.estado = builder.estado;
    }

    public static Builder builder() {
        return new Builder();
    }

    public CorteId id() {
        return id;
    }

    public List<SectorId> sectoresAfectados() {
        return sectoresAfectados;
    }

    public VentanaTiempo ventana() {
        return ventana;
    }

    public String causa() {
        return causa;
    }

    public OrigenCorte origen() {
        return origen;
    }

    public EstadoCorte estado() {
        return estado;
    }

    /** RF017 — única vía autorizada para restablecer un corte: cierra la ventana y marca el
     * estado atómicamente, así nunca puede existir un CorteAgua con estado/ventana incoherentes
     * por esta vía. */
    public CorteAgua cerrar(Instant finReal) {
        if (ventana.estaCerrada()) {
            throw new IllegalStateException("El corte '" + id.valor() + "' ya está cerrado");
        }
        return builder()
                .id(id)
                .sectoresAfectados(sectoresAfectados)
                .inicio(ventana.inicio())
                .finPrometido(ventana.finPrometido())
                .finReal(finReal)
                .causa(causa)
                .origen(origen)
                .estado(EstadoCorte.RESTABLECIDO)
                .build();
    }

    public static final class Builder {
        private CorteId id;
        private final List<SectorId> sectoresAfectados = new ArrayList<>();
        private Instant inicio;
        private Instant finPrometido;
        private Instant finReal;
        private String causa;
        private OrigenCorte origen;
        private EstadoCorte estado = EstadoCorte.ANUNCIADO;

        private Builder() {
        }

        public Builder id(CorteId id) {
            this.id = id;
            return this;
        }

        public Builder sectoresAfectados(List<SectorId> sectores) {
            this.sectoresAfectados.clear();
            this.sectoresAfectados.addAll(sectores);
            return this;
        }

        public Builder inicio(Instant inicio) {
            this.inicio = inicio;
            return this;
        }

        public Builder finPrometido(Instant finPrometido) {
            this.finPrometido = finPrometido;
            return this;
        }

        public Builder finReal(Instant finReal) {
            this.finReal = finReal;
            return this;
        }

        public Builder causa(String causa) {
            this.causa = causa;
            return this;
        }

        public Builder origen(OrigenCorte origen) {
            this.origen = origen;
            return this;
        }

        public Builder estado(EstadoCorte estado) {
            this.estado = estado;
            return this;
        }

        public CorteAgua build() {
            Objects.requireNonNull(id, "El corte debe tener id");
            if (sectoresAfectados.isEmpty()) {
                throw new IllegalStateException("El corte debe afectar al menos un sector");
            }
            Objects.requireNonNull(causa, "El corte debe tener causa");
            Objects.requireNonNull(origen, "El corte debe tener origen");
            // VentanaTiempo valida finPrometido > inicio al construirse — no se puede rodear.
            VentanaTiempo ventana = new VentanaTiempo(inicio, finPrometido, finReal);
            if (ventana.estaCerrada() != (estado == EstadoCorte.RESTABLECIDO)) {
                throw new IllegalStateException(
                        "El estado '" + estado + "' es incoherente con la ventana ("
                                + (ventana.estaCerrada() ? "cerrada" : "abierta") + ")");
            }
            return new CorteAgua(this, ventana);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CorteAgua otro)) return false;
        return Objects.equals(id, otro.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
