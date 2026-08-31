package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * M9 — lo que la ingesta automatizada *propone* para un sector, no lo que publica.
 *
 * Antes el pipeline llamaba directo a `SectorRepository.guardar()`, y con eso una expresión regular
 * sobre una nota de prensa cambiaba el estado público de un barrio, mandaba correo a sus
 * suscriptores y movía el mapa. Hoy toda detección nace como propuesta y quién la aprueba depende
 * de su origen: la del operador oficial se publica sola ({@link #esDeFuenteOficial}), la inferida de
 * prensa espera al veedor (`RevisarPropuestaIngestaUseCase`). El riesgo que importaba —inferir un
 * corte de un texto ajeno y publicarlo— sigue cubierto.
 *
 * `citaTextual` y `confianza` existen para que esa decisión sea informada: el veedor ve de dónde
 * salió la afirmación antes de publicarla. Es la misma exigencia de `ADR-006` (cita verificable en
 * toda extracción), que no se cayó con el descarte de la IA en `ADR-025`.
 */
public record PropuestaIngesta(
        PropuestaId id,
        SectorId sectorId,
        EstadoServicio estadoPropuesto,
        String fuente,
        String urlOriginal,
        String citaTextual,
        double confianza,
        Instant detectadaEn,
        EstadoRevision estadoRevision,
        Instant inicioDeclarado,
        Instant finPrometido,
        /** Portada del boletín, cuando la fuente la trae. Viaja hasta la bitácora pública. */
        String imagenUrl,
        /** Cuándo publicó la fuente el boletín. Es la fecha del hecho cuando no hay ventana declarada. */
        Instant publicadoEn,
        /** Titular tal como lo publicó la fuente. Es lo que la bitácora enseña al vecino. */
        String tituloOriginal) {

    /** Sin portada: las fuentes de prensa no la traen. */
    public PropuestaIngesta(PropuestaId id, SectorId sectorId, EstadoServicio estadoPropuesto,
                             String fuente, String urlOriginal, String citaTextual, double confianza,
                             Instant detectadaEn, EstadoRevision estadoRevision,
                             Instant inicioDeclarado, Instant finPrometido) {
        this(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual, confianza, detectadaEn,
                estadoRevision, inicioDeclarado, finPrometido, null, null, null);
    }

    public PropuestaIngesta {
        if (inicioDeclarado != null && finPrometido != null && !finPrometido.isAfter(inicioDeclarado)) {
            throw new IllegalArgumentException(
                    "La ventana declarada debe terminar después de empezar: " + inicioDeclarado
                            + " → " + finPrometido);
        }
        if (sectorId == null) {
            throw new IllegalArgumentException("La propuesta debe apuntar a un sector");
        }
        if (estadoPropuesto == null) {
            throw new IllegalArgumentException("La propuesta debe declarar el estado que propone");
        }
        if (fuente == null || fuente.isBlank()) {
            throw new IllegalArgumentException("La propuesta debe declarar su fuente");
        }
        if (confianza < 0 || confianza > 1) {
            throw new IllegalArgumentException("La confianza debe estar entre 0 y 1: " + confianza);
        }
        if (detectadaEn == null) {
            throw new IllegalArgumentException("La propuesta debe tener fecha de detección");
        }
        if (estadoRevision == null) {
            throw new IllegalArgumentException("La propuesta debe tener un estado de revisión");
        }
    }

    /** Una propuesta recién detectada siempre nace PENDIENTE: nada entra al mapa sin revisar. */
    public PropuestaIngesta(PropuestaId id, SectorId sectorId, EstadoServicio estadoPropuesto,
                             String fuente, String urlOriginal, String citaTextual,
                             double confianza, Instant detectadaEn) {
        this(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual, confianza, detectadaEn,
                EstadoRevision.PENDIENTE, null, null);
    }

    /** Con la ventana que el boletín prometió, cuando el extractor logró leerla (RF020–RF022). */
    public PropuestaIngesta(PropuestaId id, SectorId sectorId, EstadoServicio estadoPropuesto,
                             String fuente, String urlOriginal, String citaTextual,
                             double confianza, Instant detectadaEn,
                             Instant inicioDeclarado, Instant finPrometido) {
        this(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual, confianza, detectadaEn,
                EstadoRevision.PENDIENTE, inicioDeclarado, finPrometido);
    }

    /**
     * Qué estado le corresponde al sector <b>en este instante</b> según la ventana prometida. Es lo
     * que permite que un corte anunciado para mañana se publique como CORTE_PROGRAMADO hoy, pase a
     * SIN_SERVICIO cuando empieza y vuelva a CON_SERVICIO cuando termina, sin que nadie lo toque a
     * mano. Sin ventana declarada el estado no evoluciona: se queda en el que se aprobó, porque
     * inventar el momento del cambio sería el mismo dato fabricado que `ADR-006` prohíbe.
     */
    public EstadoServicio estadoVigenteEn(Instant momento) {
        if (estadoPropuesto == EstadoServicio.CON_SERVICIO || inicioDeclarado == null) {
            return estadoPropuesto;
        }
        if (momento.isBefore(inicioDeclarado)) {
            return EstadoServicio.CORTE_PROGRAMADO;
        }
        if (finPrometido != null && !momento.isBefore(finPrometido)) {
            return EstadoServicio.CON_SERVICIO;
        }
        return estadoPropuesto;
    }

    /**
     * Acuacar no es una fuente *sobre* el corte: es quien lo ejecuta. Su boletín, con cita textual y
     * URL verificable, es el anuncio oficial, no una inferencia de una expresión regular sobre texto
     * ajeno — que era exactamente el riesgo contra el que `ADR-028` levantó la cola de revisión. Por
     * eso lo oficial se publica solo y la prensa (RSS) sigue esperando al veedor.
     */
    public boolean esDeFuenteOficial() {
        return FUENTE_OFICIAL.equalsIgnoreCase(fuente);
    }

    /**
     * Con qué fecha entra este hecho a la bitácora. La bitácora es una línea de tiempo de lo que le
     * pasó al acueducto, no un registro de cuándo corrió el colector: un boletín que anuncia un
     * corte para el 21 de agosto pertenece al 21 de agosto, aunque se procese semanas después. Sin
     * esto, recuperar el histórico de Acuacar sellaría cientos de eventos con la hora de la
     * recuperación y el orden cronológico de RF026 dejaría de decir nada.
     *
     * Se usa `inicioDeclarado` porque es el instante que el propio boletín afirma, no uno inferido.
     * Si el boletín no declara ventana, no hay fecha del hecho que citar y se cae al momento de
     * detección, que es lo único verificable que queda.
     */
    public Instant momentoParaLaBitacora(Instant ahora) {
        if (inicioDeclarado != null) {
            return inicioDeclarado;
        }
        // La fecha en que la fuente lo publicó, no la hora en que lo leímos. Sin esto, recuperar el
        // histórico fecha todo "hace un momento": un boletín del 8 de julio aparecía como de hoy.
        if (publicadoEn != null) {
            return publicadoEn;
        }
        return detectadaEn != null ? detectadaEn : ahora;
    }

    private static final String FUENTE_OFICIAL = "acuacar";

    /**
     * Si esta propuesta puede fijar el estado **actual** del barrio, o solo es historia.
     *
     * Un boletín que no dice cuándo ocurre el corte no permite saber si sigue vigente. Al recuperar
     * el histórico de Acuacar eso se volvió crítico: boletines de meses atrás sin ventana declarada
     * caían en `SIN_SERVICIO` y dejaron 128 barrios pintados como sin agua hoy por cortes que ya
     * habían terminado. Un corte inventado destruye la credibilidad (`ADR-006`), así que ante la
     * duda no se toca el mapa: el hecho igual queda en la bitácora.
     *
     * `CON_SERVICIO` es la excepción porque falla hacia el lado seguro: afirmar que hay agua donde
     * el operador dice que la restableció no inventa una emergencia.
     */
    public boolean puedeFijarEstadoActual() {
        return inicioDeclarado != null || estadoPropuesto == EstadoServicio.CON_SERVICIO;
    }

    /** Idempotente, igual que {@link ReporteCiudadano#aprobar()}. */
    public PropuestaIngesta aprobar() {
        return conRevision(EstadoRevision.APROBADA);
    }

    public PropuestaIngesta descartar() {
        return conRevision(EstadoRevision.DESCARTADA);
    }

    private PropuestaIngesta conRevision(EstadoRevision nueva) {
        return new PropuestaIngesta(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual,
                confianza, detectadaEn, nueva, inicioDeclarado, finPrometido, imagenUrl, publicadoEn, tituloOriginal);
    }
}
