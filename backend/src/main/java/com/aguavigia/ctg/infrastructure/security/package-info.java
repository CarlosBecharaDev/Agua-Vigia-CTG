/**
 * Autenticacion del panel del veedor (RF019, RNF011). Una sola credencial compartida, no cuentas
 * individuales: ver ADR-016. JwtProvider emite y valida el token; JwtAuthenticationFilter lo lee
 * del header Authorization en cada peticion.
 */
package com.aguavigia.ctg.infrastructure.security;
