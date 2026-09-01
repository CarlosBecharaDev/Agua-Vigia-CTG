package com.aguavigia.ctg.api.dto;

import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Schema(description = """
        Rol de base mas los ajustes por persona. Los permisos del rol se aplican solos; `concedidos`
        anade sobre ellos y `revocados` quita. Un permiso en las dos listas es un error y se rechaza.""")
public record SolicitudPermisos(

        @NotBlank
        @Schema(description = "ADMIN, VEEDOR u OBSERVADOR")
        String rol,

        List<String> concedidos,

        List<String> revocados) {

    public PermisosEfectivos aDominio() {
        return new PermisosEfectivos(aRol(rol), aPermisos(concedidos), aPermisos(revocados));
    }

    public static RolVeedor aRol(String valor) {
        try {
            return RolVeedor.valueOf(valor.strip().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException noExiste) {
            throw new IllegalArgumentException(
                    "Rol no valido: '" + valor + "'. Debe ser ADMIN, VEEDOR u OBSERVADOR.");
        }
    }

    private static Set<Permiso> aPermisos(List<String> nombres) {
        if (nombres == null) {
            return Set.of();
        }
        return nombres.stream().map(SolicitudPermisos::aPermiso).collect(Collectors.toUnmodifiableSet());
    }

    private static Permiso aPermiso(String valor) {
        try {
            return Permiso.valueOf(valor.strip().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException noExiste) {
            throw new IllegalArgumentException("Permiso no valido: '" + valor + "'");
        }
    }
}
