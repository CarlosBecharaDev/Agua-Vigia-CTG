# Cuentas y permisos del panel

## Purpose

Sustituir la credencial compartida del panel por cuentas individuales, para que se pueda responder
quién hizo qué y retirarle el acceso a una sola persona sin cambiarle la clave a las cinco. Amplía
RF019, que solo exigía «autenticación con token» y no decía nada del modelo de cuentas. Reemplaza a
ADR-016; la decisión y sus alternativas descartadas están en ADR-039. Cubre M15 (RF042–RF046) y los
RNF022–RNF025.

## Requirements

### Requirement: Alta por solicitud con verificación y aprobación

El sistema SHALL permitir que una persona solicite una cuenta del panel con su correo, y SHALL NOT
concederle ningún permiso hasta que verifique el correo y un administrador la apruebe.

#### Scenario: Solicitud recién creada

- **WHEN** alguien envía `POST /api/cuentas/registro` con su correo
- **THEN** la cuenta queda en `PENDIENTE_VERIFICACION` y no puede entrar al panel

#### Scenario: Correo verificado, aprobación pendiente

- **WHEN** la persona verifica su correo por `POST /api/cuentas/verificacion`
- **THEN** la cuenta pasa a `PENDIENTE_APROBACION` y sigue sin poder entrar al panel

#### Scenario: Aprobación del administrador

- **WHEN** un administrador llama a `PATCH /api/veedor/usuarios/{id}/aprobacion` con un rol
- **THEN** la cuenta pasa a `ACTIVA` con los permisos base de ese rol

### Requirement: Alta por invitación con rol ya asignado

El sistema SHALL permitir a un administrador invitar a una persona por correo con un rol asignado.
Al fijar su clave desde el enlace, la cuenta SHALL quedar activa sin otra aprobación.

#### Scenario: Invitación aceptada

- **WHEN** el administrador crea la invitación por `POST /api/veedor/usuarios/invitaciones` y la
  persona fija su clave por `POST /api/cuentas/clave`
- **THEN** la cuenta queda `ACTIVA` con el rol de la invitación, sin pasar por aprobación

### Requirement: Roles como paquetes de permisos, con ajustes por persona

El sistema SHALL ofrecer los roles `OBSERVADOR`, `VEEDOR` y `ADMIN` como paquetes de permisos con
nombre, y SHALL permitir conceder o revocar permisos sueltos a una persona sobre su rol.

La autorización de cada acción SHALL evaluarse contra un permiso concreto, nunca contra el nombre
del rol (RNF022).

#### Scenario: Observador intenta moderar

- **WHEN** una cuenta con rol `OBSERVADOR` llama a un endpoint de moderación
- **THEN** la API responde 403, porque le falta el permiso `MODERAR_REPORTES`

#### Scenario: Permiso concedido por persona

- **WHEN** un administrador concede `REVISAR_INGESTA` a una cuenta `OBSERVADOR` por
  `PATCH /api/veedor/usuarios/{id}/permisos`
- **THEN** esa cuenta puede revisar la ingesta sin cambiar de rol

### Requirement: Suspensión y cambio de permisos con efecto inmediato

Suspender una cuenta o cambiar sus permisos SHALL invalidar sus sesiones vivas de inmediato, sin
esperar a que expire el token (RNF023).

#### Scenario: Cuenta suspendida con sesión abierta

- **WHEN** un administrador suspende por `PATCH /api/veedor/usuarios/{id}/suspension` una cuenta
  con un token todavía vigente
- **THEN** la siguiente petición de esa sesión se rechaza con 401

#### Scenario: Reactivación

- **WHEN** el administrador la reactiva por `PATCH /api/veedor/usuarios/{id}/reactivacion`
- **THEN** la persona puede volver a iniciar sesión, con una sesión nueva

### Requirement: Segundo factor TOTP obligatorio para ADMIN

Las cuentas con rol `ADMIN` SHALL exigir un segundo factor TOTP conforme al RFC 6238 (RNF025). La
cuenta que puede crear y despromover cuentas es la que más daño hace si se la roban.

Un token emitido a un `ADMIN` que aún no ha activado su segundo factor SHALL tener alcance
restringido: sirve para activarlo y para nada más.

#### Scenario: Primera sesión de un administrador sembrado

- **WHEN** el `ADMIN` inicial inicia sesión y todavía no tiene TOTP activo
- **THEN** su token solo le permite dar de alta el segundo factor por
  `POST /api/veedor/segundo-factor/alta` y confirmarlo

#### Scenario: Código TOTP inválido

- **WHEN** se presenta un código que no corresponde a la ventana de tiempo vigente
- **THEN** la confirmación se rechaza y el segundo factor no queda activo

### Requirement: Bitácora de auditoría del acceso

El sistema SHALL registrar en una bitácora inmutable quién cambió el acceso de quién, cuándo y
desde qué IP.

#### Scenario: Consulta de la auditoría

- **WHEN** una cuenta con permiso `VER_AUDITORIA` consulta `GET /api/veedor/auditoria`
- **THEN** obtiene los cambios de acceso con su autor, su destinatario, su instante y su IP de
  origen

### Requirement: Restablecimiento de clave por enlace de un solo uso

El sistema SHALL permitir restablecer la clave mediante un enlace de un solo uso enviado al correo,
y ese cambio SHALL cerrar todas las sesiones abiertas de la cuenta.

#### Scenario: Enlace usado dos veces

- **WHEN** se intenta reutilizar un enlace de restablecimiento ya consumido
- **THEN** la operación se rechaza

#### Scenario: Sesiones abiertas tras el cambio

- **WHEN** la persona fija su clave nueva
- **THEN** todas sus sesiones previas quedan invalidadas

### Requirement: Las respuestas no revelan qué correos tienen cuenta

El registro, el ingreso y el restablecimiento de clave SHALL NOT revelar qué correos tienen cuenta,
ni por el mensaje ni por el tiempo de respuesta (RNF024).

#### Scenario: Restablecimiento sobre un correo desconocido

- **WHEN** se pide restablecer la clave de un correo que no tiene cuenta
- **THEN** la respuesta es indistinguible —en cuerpo y en tiempo— de la de un correo que sí la
  tiene

#### Scenario: Ingreso con correo inexistente

- **WHEN** se intenta iniciar sesión con un correo sin cuenta
- **THEN** el error es el mismo que el de una clave equivocada, y tarda lo mismo
