# Registro de bugs

> Todo defecto encontrado se registra aquí **en el momento en que se encuentra**, aunque se arregle
> cinco minutos después. Un bug que se arregla sin registrar es un bug que el equipo no aprendió.
>
> **Para agregar una entrada: usa la skill `registrar-bug`.**

---

## Por qué se registra incluso lo que ya se arregló

Tres razones concretas, no burocráticas:

1. **El informe final (Capítulo IV) necesita datos, no impresiones.** "Se detectaron 23 defectos, 19
   en pruebas automatizadas antes de llegar a `develop`" es un resultado medible. "Hubo algunos
   errores" no es nada.
2. **Los bugs se repiten.** El mismo error de zona horaria aparece tres veces si nadie lo escribió la
   primera.
3. **La causa raíz suele ser un requisito mal escrito.** Un bug que se rastrea hasta un `RF` ambiguo
   corrige el requisito, no solo el código.

---

## Tabla de estado

| ID | Fecha | Sev | Módulo | Título | Estado | Responsable |
|---|---|---|---|---|---|---|
| BUG-001 | 2026-08-07 | S2 | CI | Los workflows de CI se disparaban a sí mismos y fallaban | Cerrado | D2 |
| BUG-002 | 2026-08-07 | S3 | CI | Frontend CI fallaba al asumir un script `test` que el esqueleto no tiene | Cerrado | D2 |
| BUG-003 | 2026-08-08 | S2 | — (infraestructura) | `docker compose config -q` fallaba en un clon limpio por depender de un `.env` que nunca se versiona | Cerrado | D5 |
| BUG-004 | 2026-08-08 | S2 | M5 | `PaginaVeedor.tsx` compara el acceso contra la contraseña `'1234'` escrita en el código fuente | Cerrado | D5 |
| BUG-005 | 2026-08-08 | S3 | — (proceso) | Los PRs se siguen fusionando sin revisor, y el patrón empeora en vez de mejorar | Abierto | Equipo |
| BUG-006 | 2026-08-08 | S2 | M5 | La rama `vista-previa-total` vuelve a comparar contra `'1234'` y borra la prueba que cerró `BUG-004` | Abierto | D4 |
| BUG-007 | 2026-08-08 | S2 | — (pruebas) | Testcontainers no encuentra Docker: Engine 29 exige API ≥ 1.40 y docker-java negocia 1.32 | Cerrado | D3 |
| BUG-008 | 2026-08-08 | S2 | M1 | El mapa pinta como "con servicio" los 211 sectores de los que no tiene dato | Abierto | D4 |
| BUG-009 | 2026-08-08 | S2 | — (infraestructura) | `RedisTemplate<String,String>` es ambiguo entre el bean propio y `stringRedisTemplate` de Spring | Cerrado | D3 |

**Nota de numeración:** BUG-007 y BUG-008 se registraron primero en el PR #56 (Sprint 1, sin
fusionar todavía). Esta fila usa BUG-009 para no colisionar cuando ambos PRs converjan en `develop`.

**Severidad:** `S1` bloquea el uso o publica dato falso · `S2` funcionalidad rota con rodeo posible ·
`S3` molesto pero no impide · `S4` cosmético
**Estado:** `Abierto` · `En curso` · `Cerrado` · `No se corrige` (con motivo)

---

## Bugs abiertos — detalle

### BUG-009 — `RedisTemplate<String,String>` es ambiguo entre el bean propio y `stringRedisTemplate` de Spring

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** — (infraestructura) · **Responsable:** D3
- **Estado:** Cerrado — corregido en el mismo PR que lo encontró

**Síntoma:** al inyectar `RedisTemplate<String, String>` por tipo en `RedisContadorReportesAdapter`,
Spring falla al arrancar el contexto de prueba con
`NoUniqueBeanDefinitionException: ... expected single matching bean but found 2: redisTemplate,stringRedisTemplate`.

**Reproducción:** consistente. `RedisConfig.java` (Sprint 0) define un bean `redisTemplate` de tipo
`RedisTemplate<String, String>`. La autoconfiguración de Spring Boot registra además
`stringRedisTemplate` — de tipo `StringRedisTemplate`, que **extiende** `RedisTemplate<String, String>`
y por eso también encaja en cualquier inyección por ese tipo. La autoconfiguración de este segundo
bean no está condicionada a que falte el primero, así que los dos siempre coexisten.

**Esperado:** que inyectar el `RedisTemplate<String, String>` de `RedisConfig` sea inequívoco.

**Causa raíz:** ningún código había consumido ese bean por tipo hasta este PR — `RedisConfig` existía
desde el Sprint 0/1 como andamiaje, sin consumidor que expusiera la ambigüedad. Le iba a pasar al
primer `@Autowired RedisTemplate<String,String>` que alguien del equipo escribiera, en cualquier capa.

**Corrección:** `RedisContadorReportesAdapter` — parámetro de constructor calificado con
`@Qualifier("redisTemplate")`. Cubierto por la propia suite de integración de
`RedisContadorReportesAdapterTest`: si el contexto no puede resolver el bean, las 6 pruebas fallan al
arrancar (ya lo hicieron, en el diagnóstico de este bug).

---

### BUG-006 — La rama `vista-previa-total` vuelve a pedir la contraseña `'1234'` y borra la prueba que lo impedía

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M5 · **Responsable:** D4
- **Estado:** Abierto — **no está en `develop`**; se dispara solo si la rama se fusiona sin poner al día

**Síntoma:** en `origin/vista-previa-total`, `frontend/src/pages/PaginaVeedor.tsx:16` vuelve a
contener `if (contraseña === '1234')` y el texto *"Código de acceso temporal (MOCK: usa 1234)"* en la
línea 33 — exactamente el defecto que cerró `BUG-004`. En la misma rama,
`frontend/src/pages/PaginaVeedor.test.tsx` aparece **borrado**, que es la prueba escrita para impedir
esta regresión.

**Reproducción:** consistente, 2 de 2 ejecuciones.

```
git show origin/develop:frontend/src/pages/PaginaVeedor.tsx | grep -c 1234          → 0
git show origin/vista-previa-total:frontend/src/pages/PaginaVeedor.tsx | grep -c 1234 → 2
git diff --name-status origin/develop origin/vista-previa-total -- frontend/src/pages/PaginaVeedor.test.tsx → D
```

**Esperado:** `develop` no vuelve a contener una credencial comparable escrita en el código, y
`PaginaVeedor.test.tsx` sigue existiendo y en verde. `BUG-004` quedó cerrado con esa prueba como
condición de cierre.

**Causa raíz:** la rama se creó antes del PR #30 (el que corrigió `BUG-004`) y nunca se sincronizó con
`develop`. Al fusionarla, su versión antigua del archivo pisa la corregida y arrastra consigo el
borrado del test. No es un cambio deliberado de D4: es divergencia por una rama larga sin rebase.

**Corrección:** pendiente. Condición de entrada del PR de M5 (paso 4 del plan de integración):
`git rebase origin/develop` sobre la rama, conservar `PaginaVeedor.test.tsx` y correr `npm test` en
verde antes de abrir el PR. Sin eso, el PR no se fusiona.

---

### BUG-005 — Los PRs se fusionan sin revisor, y el patrón empeora

**Síntoma:** la auditoría del 2026-08-08 (sesión de D3) encontró 18 de 32 PRs fusionados sin revisor
registrado, ya un incumplimiento de la política de `ADR-010`. El mismo día, después de dejarlo escrito
en `sprint-0.md`, los PRs #40, #41 y #42 se fusionaron igual sin revisor: los tres, fusionados por
Carlos (D2) en un lapso de 30 segundos (07:37:03–07:37:33 UTC), con `reviews: []` y `comments: []`
verificado con `gh pr view --json reviews,comments`. Esto es relevante en particular para el PR #42
(propuesta de `ADR-012`), cuyo propio texto pedía explícitamente aprobación por comentario antes de
fusionarse — la fusión no la sustituye, y el ADR se mantiene en estado *Propuesta* por esa razón.
**Reproducción:** cualquier PR abierto en este repositorio puede fusionarse sin que nadie deje un
comentario o *review* — no hay protección de rama configurada (`ADR-010`, decisión deliberada: es
política, no candado técnico).
**Esperado:** `docs/gestion/README.md` §"Definición de terminado" exige *"entró por Pull Request con
al menos 1 revisor"* para cualquier entregable.
**Causa raíz:** la política es solo documentada, no técnica (`ADR-010`), y hoy no hay ningún hábito ni
recordatorio que la haga cumplir en la práctica — cada quien fusiona su propio trabajo o el de otro sin
pausar a pedir o dejar una revisión.
**Corrección:** *pendiente.* No es un bug de código: es un hábito de equipo. Posible acción concreta
para la retrospectiva del Sprint 0: acordar que nadie fusiona su propio PR sin al menos un comentario
de otro integrante, y que el Scrum Master del sprint lo verifique antes de cerrar el sprint.

---

### BUG-004 — `PaginaVeedor.tsx` compara el acceso contra una contraseña escrita en el código *(cerrado)*

**Síntoma:** `frontend/src/pages/PaginaVeedor.tsx` comparaba la "autenticación" contra la cadena
literal `'1234'` escrita en el código, con un placeholder "MOCK: usa 1234". Fusionado a `develop`
con el PR #20.
**Causa raíz:** al maquetar el panel con datos mock (Sprint 3, C2 todavía cerrada), el gate de acceso
se modeló como un formulario de contraseña real en vez de un simulador explícito.
**Corrección:** se quitó el campo de contraseña y su comparación; el acceso mock ahora es un botón
"Simular ingreso de veedor" sin credencial comparable en el código —
`frontend/src/pages/PaginaVeedor.tsx`. Cerrado por D5 con autorización del equipo, no por D4, por ser
un fix simple con solución ya aceptada en el PR #20.
**Prueba que impide la regresión:** `frontend/src/pages/PaginaVeedor.test.tsx` — verifica que no exista
ningún `input[type="password"]` ni `textbox`, y que el botón de simulación lleve al panel de moderación.

---

## Nota sobre BUG-001 y BUG-002

Ambos se encontraron y se corrigieron durante la revisión de los PRs #1 y #5, y **se registraron
tarde**, en la auditoría del 2026-08-07. Se dejan escritos porque son exactamente lo que la regla 2 de
`README.md` pide capturar: defectos reales, atrapados por la revisión por pares antes de llegar a
`develop`. Son los dos primeros datos del Capítulo IV.

**Causa raíz común:** ambos workflows se escribieron asumiendo un repositorio que todavía no existía
—uno con `backend/`, `frontend/` y un script `test`—. La lección es del proceso, no de quien los
escribió: la configuración de CI se valida contra el estado **actual** del repositorio, no contra el
que tendrá en el Sprint 2.

**Corrección:** `0cb3b06` (quitar el propio archivo del filtro `paths`) y `f9c19c2` (detectar el
script `test` antes de invocarlo).
**Prueba que impide la regresión:** ninguna automatizada. Es una limitación conocida — no hay forma
barata de probar un workflow sin ejecutarlo. Mitigación: el paso de tests de `frontend-ci.yml` ya es
tolerante a su ausencia, y `backend-ci.yml` correrá por primera vez cuando D2 suba `/backend`, lo que
lo pone bajo prueba real ese mismo día.

---

## Nota sobre BUG-003

**Síntoma:** el comando exacto de la compuerta C0 (`docker compose config -q`) fallaba con
`env file .../.env not found` en cualquier clon recién hecho del repositorio, antes de que la persona
creara su `.env` a partir de `.env.example`. Contradice el objetivo explícito del Sprint 0
(`docs/gestion/sprint-0.md`): "que cualquiera de los cinco pueda clonar el repositorio, levantar el
entorno con un comando".

**Cómo se encontró:** D5 instaló el cliente de Docker (no estaba disponible antes en su máquina) para
poder correr el comando **literal** de la compuerta en vez de verificar solo la mitad (`ls backend
frontend`). Al correrlo por primera vez, falló.

**Causa raíz:** el servicio `mongo` de `docker-compose.yml` declaraba `env_file: .env` como referencia
obligatoria. El resto del archivo ya usaba valores por defecto (`${VAR:-default}`); ese único campo no.

**Corrección:** `docker-compose.yml` — `env_file: .env` cambiado a la sintaxis de Compose Specification
que lo marca opcional: `env_file: [{path: .env, required: false}]`. Verificado con el comando exacto de
la compuerta, exit code 0, con y sin `.env` presente.
**Prueba que impide la regresión:** ninguna automatizada todavía — pendiente agregar
`docker compose config -q` sobre un checkout limpio como paso de CI. Anotado, no bloqueante.

---

## Regla especial: bugs que publican información falsa

Un defecto que haga que la plataforma muestre un corte que no existe, o un Índice de Cumplimiento
equivocado, es **siempre S1**, sin discusión y sin importar cuán raro sea el caso.

El único activo de este proyecto es la credibilidad. Un mapa que se ve lento es un problema; un mapa
que miente es el final del proyecto. Ver `ADR-006` y `MEMORY.md`.

---

<!--
Plantilla de bug abierto — copiar a la sección "Bugs abiertos — detalle".

### BUG-NNN — <título en una línea, describe el síntoma, no la causa supuesta>

- **Fecha:** AAAA-MM-DD · **Severidad:** S<N> · **Módulo:** M<N> · **Responsable:** D<N>
- **Estado:** Abierto

**Síntoma:** qué se observó. Hechos, no interpretación.
**Reproducción:** pasos exactos. Si no se puede reproducir, dilo — es parte del reporte.
**Esperado:** qué debería pasar, y por qué (cita el RF si aplica).
**Causa raíz:** se llena al diagnosticar. Si el origen es un requisito ambiguo, corrige también el requisito.
**Corrección:** qué se cambió + `archivo:línea` + prueba que lo cubre. Sin prueba, el bug vuelve.

Siguiente número disponible: BUG-007
-->
