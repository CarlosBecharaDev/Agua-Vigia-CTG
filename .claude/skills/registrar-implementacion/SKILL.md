---
name: registrar-implementacion
description: Registra en docs/gestion/registro-de-implementaciones.md una unidad de trabajo terminada y fusionada, con su requisito, su Pull Request y su prueba. Úsala al fusionar un PR a develop o cuando el usuario diga que terminó una funcionalidad.
---

# Registrar una implementación

Convierte "ya está listo" en evidencia verificable: qué requisito quedó cubierto, con qué PR y con qué
prueba. Es el insumo directo de la matriz de trazabilidad y del Capítulo IV del informe.

## Cuándo usar esto

Cuando un Pull Request se fusiona a `develop`. **No antes** — el código en una rama de trabajo todavía
puede cambiar o descartarse.

## Paso 1 — Verificar la definición de terminado

Antes de escribir la fila, comprueba (`docs/gestion/README.md`, sección Definición de terminado):

- [ ] La build pasa completa: compila, tests, ArchUnit, linter
- [ ] Hay prueba del flujo principal **y** de al menos un caso de borde
- [ ] El PR tuvo al menos 1 revisor y enlaza su issue y su `RF`

**Si algo falta, dilo y no registres la fila.** Registrar como terminado lo que no lo está vuelve
inútil la métrica de cobertura del Capítulo IV.

## Paso 2 — Localizar el requisito

Busca el id en `docs/product-requirements.md`.

- **Si no existe un requisito que cubra lo implementado**, hay un problema real: o se construyó algo
  fuera de alcance, o falta escribir el requisito. Señálalo antes de continuar; no inventes un id.
- **Si el requisito quedó cubierto solo en parte**, dilo en la columna "Qué" en vez de darlo por
  completo.

## Paso 3 — Escribir la fila

En la tabla del sprint en curso de `docs/gestion/registro-de-implementaciones.md`:

```markdown
| RF0NN | M<N> | <qué quedó funcionando, en pasado> | D<N> | #<PR> | <nombre de la prueba> |
```

Después actualiza la tabla **Estado de cobertura de requisitos** al final del archivo.

## Paso 4 — Efectos colaterales

| Si la implementación… | Entonces |
|---|---|
| Cambió una decisión de diseño | Nuevo ADR con la skill `registrar-decision` |
| Reveló un hecho que costó descubrir | Línea en `MEMORY.md` |
| Reveló que un requisito estaba mal escrito | Corrige `docs/product-requirements.md` y dilo |
| Tocó el backend | Verifica las capas con la skill `verificar-arquitectura` |

## Reglas de escritura

- **En pasado y concreto.** `Endpoint POST /api/reportes con rate limiting por dispositivo en Redis`,
  no `avance en el módulo de reportes`.
- **La prueba se nombra.** `RegistrarReporteServiceTest`, `reporte.spec.ts`. "Probado manualmente" no
  es una prueba: es un recuerdo.
- **Una fila por unidad entregada**, no una por commit ni una por sprint.

## Efecto en la Sala de control

Esta fila alimenta la Sala de control (`docs/gestion/README.md`), que se regenera sola en cada push a
`develop` — **el HTML no se edita a mano**. Si el PR además cerró un compromiso del sprint, marca su
`docs/gestion/sprint-N.md` §2, con `✅`/`🟡` al inicio del Entregable: sin eso
el tablero seguirá diciendo que el trabajo está sin empezar, y el avance del proyecto saldrá más bajo
de lo que es.
