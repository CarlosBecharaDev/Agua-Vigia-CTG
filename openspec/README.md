# Especificaciones vivas (OpenSpec)

Aquí vive **qué hace el sistema hoy**, en comportamiento observable. Es la capa de especificación
del proyecto, y es validable con un comando:

```bash
openspec validate --specs
```

Decidido en `ADR-040`.

## Qué va en cada sitio

| Pregunta | Archivo | Formato |
|---|---|---|
| ¿Qué hace el sistema? | `openspec/specs/<capacidad>/spec.md` | `Requirement` + `Scenario` con `WHEN`/`THEN` |
| ¿Por qué se decidió así? | `docs/design-decisions.md` | ADR: contexto, alternativas, consecuencias |
| ¿Qué exige el SRS académico? | `docs/product-requirements.md` | `RF`/`RNF` con prioridad MoSCoW |
| ¿Qué prueba sostiene cada requisito? | `docs/ingenieria/matriz-trazabilidad.md` | Matriz `RF` → prueba |
| ¿Cuál es el contrato HTTP? | `backend/openapi.yaml` | OpenAPI 3 |

**Un dato vive en un solo archivo.** La spec no repite el porqué; el ADR no repite el
comportamiento. Cada spec cita los `RF` y los `ADR` que la sostienen — esos identificadores siguen
siendo la numeración oficial ante el docente, y las specs no los reemplazan ni los renumeran.

## Las trece capacidades

| Capacidad | Módulo | Requisitos |
|---|---|---|
| `mapa-en-vivo` | M1 | RF001–RF004 |
| `reporte-ciudadano` | M2 · M10 · M11 | RF005–RF008, RF037, RF038 |
| `consenso-automatico` | M3 | RF009–RF011 |
| `alertas-por-correo` | M4 | RF012–RF015 |
| `panel-del-veedor` | M5 | RF016–RF019 |
| `indice-de-cumplimiento` | M6 | RF020–RF022 |
| `estadisticas` | M7 | RF023–RF025 |
| `bitacora-publica` | M8 | RF026–RF028 |
| `ingesta-automatizada` | M9 | RF029–RF031 |
| `api-open311` | M12 | RF039 |
| `telemetria-iot` | M13 | RF040 |
| `alertas-push` | M14 | RF041 |
| `cuentas-y-permisos` | M15 | RF042–RF046 |

## Cómo se trabaja

Un cambio de comportamiento entra por una propuesta **antes** de tocar el código:

```bash
openspec list            # cambios en curso
openspec list --specs    # capacidades vigentes
openspec show <nombre>   # ver una spec o un cambio
openspec validate        # validar todo
```

Desde Claude Code, con las skills que instaló `openspec init`:

| Quiero | Comando |
|---|---|
| Proponer un cambio con todos sus artefactos | `/opsx:propose "lo que quiero construir"` |
| Pensar algo en voz alta antes de proponerlo | `/opsx:explore` |
| Implementar las tareas de un cambio | `/opsx:apply` |
| Llevar el cambio a las specs principales | `/opsx:sync` |
| Cerrar y archivar un cambio terminado | `/opsx:archive` |

Reglas del proyecto que siguen mandando sobre esto:

- Si un cambio elige entre alternativas técnicas, además deja su **ADR** en
  `docs/design-decisions.md` (skill `registrar-decision`).
- **Una spec que se separa del código es un defecto**, igual que una prueba que miente. Quien cambie
  comportamiento actualiza su spec en el mismo PR.
- Las specs se escriben en español; los encabezados estructurales de OpenSpec y las palabras
  `SHALL`/`MUST` se quedan en inglés, porque el validador los busca literalmente.
