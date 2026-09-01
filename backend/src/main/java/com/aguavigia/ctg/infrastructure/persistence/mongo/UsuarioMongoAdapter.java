package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.SegundoFactor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UsuarioMongoAdapter implements UsuarioRepository {

    private final UsuarioMongoRepository repositorio;

    public UsuarioMongoAdapter(UsuarioMongoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Override
    public Usuario guardar(Usuario usuario) {
        UsuarioDocumento documento = new UsuarioDocumento();
        documento.setId(usuario.id().valor());
        documento.setCorreo(usuario.correo().normalizado().valor());
        documento.setNombre(usuario.nombre());
        documento.setClaveHash(usuario.claveHash() == null ? null : usuario.claveHash().valor());
        documento.setEstado(usuario.estado().name());
        documento.setRol(usuario.permisos().rol().name());
        documento.setPermisosConcedidos(aNombres(usuario.permisos().concedidos()));
        documento.setPermisosRevocados(aNombres(usuario.permisos().revocados()));
        documento.setSecretoTotp(usuario.segundoFactor() == null
                ? null : usuario.segundoFactor().secreto().valor());
        documento.setSegundoFactorConfirmadoEn(usuario.segundoFactor() == null
                ? null : usuario.segundoFactor().confirmadoEn());
        documento.setCreadoEn(usuario.creadoEn());
        documento.setActualizadoEn(usuario.actualizadoEn());

        repositorio.save(documento);
        return usuario;
    }

    @Override
    public Optional<Usuario> buscarPorId(UsuarioId id) {
        return repositorio.findById(id.valor()).map(UsuarioMongoAdapter::aDominio);
    }

    @Override
    public Optional<Usuario> buscarPorCorreo(CorreoElectronico correo) {
        return repositorio.findByCorreo(correo.normalizado().valor()).map(UsuarioMongoAdapter::aDominio);
    }

    @Override
    public boolean existePorCorreo(CorreoElectronico correo) {
        return repositorio.existsByCorreo(correo.normalizado().valor());
    }

    /** Más recientes primero: el panel abre por lo que acaba de llegar, que es lo que hay que atender. */
    @Override
    public Pagina<Usuario> listar(EstadoCuenta filtroEstado, int pagina, int tamano) {
        PageRequest peticion = PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.DESC, "creadoEn"));
        Page<UsuarioDocumento> resultado = filtroEstado == null
                ? repositorio.findAll(peticion)
                : repositorio.findByEstado(filtroEstado.name(), peticion);

        return new Pagina<>(
                resultado.getContent().stream().map(UsuarioMongoAdapter::aDominio).toList(),
                pagina,
                tamano,
                resultado.getTotalElements());
    }

    @Override
    public long contarActivosPorRol(RolVeedor rol) {
        return repositorio.countByRolAndEstado(rol.name(), EstadoCuenta.ACTIVA.name());
    }

    private static List<String> aNombres(Set<Permiso> permisos) {
        return permisos.stream().map(Permiso::name).sorted().toList();
    }

    /**
     * Un permiso que ya no existe en el enum se descarta en vez de reventar la lectura: si una
     * versión futura elimina un Permiso, las cuentas que lo tuvieran concedido deben seguir
     * pudiendo entrar con los que sí existen, no quedar ilegibles.
     */
    private static Set<Permiso> aPermisos(List<String> nombres) {
        if (nombres == null) {
            return Set.of();
        }
        return nombres.stream()
                .map(nombre -> {
                    try {
                        return Permiso.valueOf(nombre);
                    } catch (IllegalArgumentException permisoRetirado) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toUnmodifiableSet());
    }

    private static Usuario aDominio(UsuarioDocumento documento) {
        SegundoFactor segundoFactor = documento.getSecretoTotp() == null
                ? null
                : new SegundoFactor(new SecretoTotp(documento.getSecretoTotp()),
                        documento.getSegundoFactorConfirmadoEn());

        return new Usuario(
                new UsuarioId(documento.getId()),
                new CorreoElectronico(documento.getCorreo()),
                documento.getNombre(),
                documento.getClaveHash() == null ? null : new ClaveHash(documento.getClaveHash()),
                EstadoCuenta.valueOf(documento.getEstado()),
                new PermisosEfectivos(
                        RolVeedor.valueOf(documento.getRol()),
                        aPermisos(documento.getPermisosConcedidos()),
                        aPermisos(documento.getPermisosRevocados())),
                segundoFactor,
                documento.getCreadoEn(),
                documento.getActualizadoEn());
    }
}
