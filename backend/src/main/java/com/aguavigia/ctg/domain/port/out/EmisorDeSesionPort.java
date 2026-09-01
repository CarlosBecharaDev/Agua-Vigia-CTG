package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.Usuario;

/**
 * Convierte una cuenta ya autenticada en la credencial que viajará al cliente. Es un puerto para
 * que la capa de aplicación pueda decidir *que* se emite una sesión sin saber que por debajo es un
 * JWT firmado con HS256 — cambiar a tokens opacos en Redis no debería tocar ningún caso de uso.
 */
public interface EmisorDeSesionPort {

    String emitir(Usuario usuario, AlcanceSesion alcance);
}
