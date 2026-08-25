# Gestión del proyecto

> Cómo se organiza el trabajo, qué se registra y dónde. Si buscas **qué** construimos, ve a
> `docs/brief.md`; aquí está **cómo se lleva la cuenta**.

---

## Qué hay en esta carpeta

| Archivo | Para qué | Cuándo se toca |
|---|---|---|
| [`protocolo-de-contexto.md`](protocolo-de-contexto.md) | Reglas de ahorro de tokens y dónde vive cada dato | **Léelo antes de tu primera sesión** |
| [`bitacora-sesiones.md`](bitacora-sesiones.md) | Qué hizo cada sesión de trabajo con IA | Al cerrar cada sesión |
| [`registro-de-bugs.md`](registro-de-bugs.md) | Defectos, causa raíz y corrección | Al encontrar un bug |
| [`registro-de-implementaciones.md`](registro-de-implementaciones.md) | Qué requisito pasó a funcionando | Al fusionar un PR a `develop` |
| [`registro-de-bloqueos.md`](registro-de-bloqueos.md) | Estado de las compuertas y quién está detenido esperando a quién | Al detectar un bloqueo y al abrir una compuerta |
| [`plantilla-sprint.md`](plantilla-sprint.md) | Planning, review y retrospectiva | Al abrir y cerrar cada sprint |
| `sprint-N.md` | Un archivo por sprint, desde la plantilla | Durante el sprint |
| `historico/` | Registros rotados de sprints cerrados | Al cerrar el sprint |

---

## Las cuatro reglas de registro — no negociables

Son parte de la definición de terminado del proyecto, no una formalidad.

**1. Toda implementación se registra.**
Al fusionar un PR a `develop`, una fila en `registro-de-implementaciones.md` con su `RF`, su PR y su
prueba. Un requisito sin fila no cuenta como implementado, aunque el código exista. **Aplica a todo
PR fusionado**, no solo al que implementa un requisito: el andamiaje, la infraestructura y los
cambios de proceso llevan `RF = —` y su `Tipo`, y no suman a la cobertura (`ADR-009`).

**2. Todo bug se registra al encontrarlo**, aunque se arregle en el acto.
Con severidad, causa raíz y la prueba que impide que vuelva. Un bug arreglado sin prueba es un bug que
regresa en el siguiente sprint.

**3. Toda sesión de trabajo con IA se cierra con su entrada en la bitácora.**
Tres líneas: qué se logró y cuál es el siguiente paso. Es lo que permite que otro compañero —o tú
mismo mañana— retome sin reconstruir la conversación.

**4. Todo bloqueo se registra y se avisa.**
Si una tarea no puede avanzar porque su insumo lo produce otro rol y aún no existe, se detiene, se
registra en `registro-de-bloqueos.md` y **se avisa en el chat del equipo**. Rodear un bloqueo
inventando el insumo que falta —tipos escritos a mano, un contrato "provisional"— es la única forma
conocida de que cinco personas construyan cinco sistemas incompatibles. Ver
`docs/equipo/secuencia-de-trabajo.md` §2 y §5.

**5. Quien avanza, actualiza el registro que le toca — humano o IA, sin excepción.**
Terminar una funcionalidad, arreglar un bug, destrabar un bloqueo o retirar un mock **no está
completo hasta que su registro lo dice**. No es burocracia: la [Sala de
control](https://carlosbecharadev.github.io/Agua-Vigia-CTG/) que los cinco miran para saber cómo va
el proyecto se genera de estos archivos y de nada más.

Las cuatro primeras tienen skill propia: `registrar-implementacion`, `registrar-bug`, `cerrar-sesion`,
`registrar-bloqueo`.

---

## La Sala de control — se actualiza sola, si tú actualizas tu registro

`https://carlosbecharadev.github.io/Agua-Vigia-CTG/` · se regenera en **cada push a `develop`** y cada
hora (`.github/workflows/dashboard.yml` → `scripts/generar-dashboard.mjs`).

**Nadie edita ese HTML. No se puede "arreglar el tablero" a mano.** El generador lee PRs e issues
reales con `gh` y parsea los archivos de esta carpeta; si un dato no está escrito donde toca, para el
tablero no existe. Lo que muestra cada sección y de dónde sale:

| En la Sala de control se ve | Sale de |
|---|---|
| Qué falta para cerrar el sprint | `sprint-N.md` §2 — `✅` hecho · `🟡` parcial · sin marca, pendiente. Sirve al **principio del Entregable** (`✅ Entregado — …`, como se viene marcando) o en una columna `Estado` al final de la fila |
| Objetivo y criterio de cierre del sprint | `sprint-N.md` §1 y el paréntesis de `**Cerrado:** —` en la cabecera |
| Quién está detenido y por qué | `registro-de-bloqueos.md` §2 — campos **Rol bloqueado**, **Insumo que falta**, **Titular** |
| Deuda técnica / mocks vigentes | `registro-de-bloqueos.md` §4 — columna **Estado** (`🟡 Vigente`) |
| Compuertas y quién habilita a quién | `registro-de-bloqueos.md` §1 |
| Bugs, con severidad y responsable | `registro-de-bugs.md` — tabla de estado |
| Cobertura por módulo | `registro-de-implementaciones.md` — tabla **Estado de cobertura** |
| Decisiones pendientes | `docs/design-decisions.md` — campo **Estado** de cada ADR |
| Recomendaciones de la IA | `recomendaciones-ia.md` |

**Si cambias el formato de una de esas tablas, se rompe el extractor.** Antes de fusionar un cambio
de formato, corre `node scripts/generar-dashboard.mjs` y revisa que los conteos que imprime al final
sigan siendo los correctos: el comando avisa cuando una sección queda vacía.

---

## Los siete sprints

**7 sprints. Sprint 0 de preparación + 6 de construcción.** No tienen duración fija.

**Un sprint se marca como completado cuando su entregable se demuestra funcionando, no cuando se
acaba la semana.** La columna "Entregable que lo cierra" es la definición, no una aspiración: mientras
eso no se pueda mostrar corriendo, el sprint sigue abierto por rápido que se haya ido; y cuando se
puede mostrar, el sprint cierra aunque hayan pasado tres días.

| Sprint | Foco | Entregable que lo cierra |
|---|---|---|
| **0** | Documentación, infraestructura, contratos | Repositorio operativo, `docker compose up` funcionando |
| **1** | Mapa base y dominio core | Mapa mostrando sectores reales de Cartagena |
| **2** | Reporte ciudadano y consenso | Un vecino reporta en 2 toques y el consenso cambia el estado |
| **3** | Administración y alertas | El veedor registra un corte y el suscriptor recibe el correo |
| **4** | Ingesta con IA y Cumplimiento ⭐ | Un boletín real de Acuacar entra solo y se calcula su índice |
| **5** | Calidad, accesibilidad y PWA | Cobertura ≥ 70%, auditoría WCAG AA, E2E en verde |
| **6** | Entrega final y sustentación | Informe completo, demo desplegada, dataset histórico cargado |

Detalle de tareas por persona: `docs/equipo/secuencia-de-trabajo.md`.

---

## Ceremonias

| Ceremonia | Cuándo | Duración | Deja escrito |
|---|---|---|---|
| **Planning** | Al abrir el sprint, antes de la primera tarea | 1 h | Objetivo del sprint y compromisos en `sprint-N.md` |
| **Daily** | Al menos 3 veces por semana mientras el sprint esté abierto | 15 min | Nada. Si algo hay que escribir, es un bloqueo → issue |
| **Review** | Cuando el entregable del sprint se puede demostrar corriendo | 1 h | Qué se demostró funcionando, en `sprint-N.md` |
| **Retrospectiva** | Después del review | 45 min | Máximo 3 acciones concretas, con responsable |

**La retrospectiva no produce buenos deseos.** "Comunicarnos mejor" no es una acción. "D3 publica el
OpenAPI el miércoles de la semana 2" sí lo es.

---

## Definición de terminado — común a todos

Aplica a cualquier entregable, encima de la definición específica de cada rol
(`docs/equipo/D*.md` §3).

- [ ] El código pasa la build completa: compila, tests, ArchUnit, linter
- [ ] Tiene pruebas que cubren el flujo principal y al menos un caso de borde
- [ ] Entró por Pull Request con al menos 1 revisor, enlazando su issue y su `RF`
- [ ] Fila agregada en `registro-de-implementaciones.md`
- [ ] Si tocó una decisión de diseño → ADR en `docs/design-decisions.md`
- [ ] Si reveló un hallazgo que costó descubrir → línea en `MEMORY.md`
- [ ] La sesión de trabajo quedó cerrada en `bitacora-sesiones.md`
