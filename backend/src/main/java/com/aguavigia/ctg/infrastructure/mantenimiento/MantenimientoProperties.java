package com.aguavigia.ctg.infrastructure.mantenimiento;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * `aguavigia.mantenimiento` en application.yml — dos jobs distintos, cada uno con su propio
 * opt-in (mismo criterio que RateLimitProperties: sin sorpresas por default).
 *
 * <pre>
 * aguavigia:
 *   mantenimiento:
 *     fotos-huerfanas:
 *       habilitada: true
 *       antiguedad-minima-horas: 24
 *     retencion-evidencia:
 *       habilitada: false
 *       dias-retencion: 365
 * </pre>
 */
@ConfigurationProperties(prefix = "aguavigia.mantenimiento")
public record MantenimientoProperties(
        FotosHuerfanas fotosHuerfanas,
        RetencionEvidencia retencionEvidencia) {

    public MantenimientoProperties {
        fotosHuerfanas = fotosHuerfanas != null ? fotosHuerfanas : new FotosHuerfanas(true, 24);
        retencionEvidencia = retencionEvidencia != null ? retencionEvidencia : new RetencionEvidencia(false, 365);
    }

    /**
     * Reconciliación disco-vs-Mongo. Habilitada por defecto: es pura higiene sin riesgo de
     * pérdida de datos reales — solo borra archivos que ningún reporte referencia.
     */
    public record FotosHuerfanas(
            @DefaultValue("true") boolean habilitada,
            @DefaultValue("24") int antiguedadMinimaHoras) {

        public FotosHuerfanas {
            if (antiguedadMinimaHoras <= 0) {
                throw new IllegalArgumentException(
                        "aguavigia.mantenimiento.fotos-huerfanas.antiguedad-minima-horas debe ser mayor que cero");
            }
        }
    }

    /**
     * Purga de evidencia por retención (data minimization). Deshabilitada por defecto: cuánto
     * tiempo conservar la foto de un reporte es una decisión de política de datos de cada
     * despliegue, no algo que este backend deba imponer.
     */
    public record RetencionEvidencia(
            @DefaultValue("false") boolean habilitada,
            @DefaultValue("365") int diasRetencion) {

        public RetencionEvidencia {
            if (diasRetencion <= 0) {
                throw new IllegalArgumentException(
                        "aguavigia.mantenimiento.retencion-evidencia.dias-retencion debe ser mayor que cero");
            }
        }
    }
}
