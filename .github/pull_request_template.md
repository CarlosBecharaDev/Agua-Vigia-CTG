## Qué hace este PR

<!-- Una o dos frases, en pasado y con el resultado. No la intención. -->

**Requisito:** RF0NN / RNF0NN
**Módulo:** M<N>
**Cierra:** #<issue>

---

## Cómo se verifica

<!-- Nombre de la prueba automatizada. "Probado manualmente" no es una prueba. -->

- Prueba:
- Caso de borde cubierto:

---

## Antes de pedir revisión

- [ ] La build pasa completa: compila, tests, **ArchUnit**, linter
- [ ] Hay prueba del flujo principal **y** de al menos un caso de borde
- [ ] `domain/` no importa `org.springframework` ni `com.mongodb`
- [ ] No expongo entidades de dominio en la API (van DTOs)
- [ ] Sin credenciales, tokens ni URLs con secretos en el diff
- [ ] Commits en Conventional Commits, en español e imperativo

## Si aplica

- [ ] Si tomé una decisión de diseño → **ADR** en `docs/design-decisions.md`
- [ ] Si descubrí algo que costó descubrir → línea en `MEMORY.md`
- [ ] Si toqué interfaz → cumple el checklist de `DESIGN.md` §10
- [ ] Si arreglé un bug → registrado en `docs/gestion/registro-de-bugs.md` con causa raíz

## Al fusionar (no antes)

- [ ] Fila agregada en `docs/gestion/registro-de-implementaciones.md` (skill `registrar-implementacion`)

### Lo que este PR le cambia a la Sala de control — obligatorio

La [Sala de control](https://carlosbecharadev.github.io/Agua-Vigia-CTG/) se regenera sola en cada
push a `develop`: **nadie edita el HTML**. Pero solo sabe lo que estos archivos digan, así que un PR
que avanza el trabajo sin actualizarlos deja el tablero mintiéndole a las cinco personas. Marca lo
que corresponda — si no aplica ninguno, di por qué en el cuerpo del PR.

- [ ] **Compromiso del sprint** entregado o a medias → `docs/gestion/sprint-N.md` §2, marcando `✅ Entregado — …` o `🟡 …` al principio de su Entregable
- [ ] **Bug** encontrado o cerrado → `docs/gestion/registro-de-bugs.md` (skill `registrar-bug`)
- [ ] **Bloqueo** abierto o cerrado → `docs/gestion/registro-de-bloqueos.md` §2/§3 (skill `registrar-bloqueo`)
- [ ] **Compuerta** que este PR abre → tabla §1 de `registro-de-bloqueos.md`, con su comando de verificación
- [ ] **Mock retirado** → la fila `DT-00N` de `registro-de-bloqueos.md` §4 pasa a saldada
- [ ] **Requisito demostrado en review** → tabla de cobertura por módulo en `registro-de-implementaciones.md`

---

## Para el revisor

<!-- ¿Qué te preocupa? ¿Dónde quieres que miren con más atención? Sé específico:
     ahorra tiempo y mejora la revisión. -->
