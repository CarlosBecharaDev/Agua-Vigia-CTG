---
name: Historia de usuario
about: Una unidad de valor para un usuario real, trazada a su requisito
title: "[HU0NN] "
labels: historia
---

**Requisito:** RF0NN · **Módulo:** M<N> · **Sprint:** N · **Responsable:** D<N>

## Historia

**Como** <vecino / comerciante / veedor / periodista / sistema>
**quiero** <qué>
**para** <qué obtengo con eso>

<!-- El "para" es el que importa: si no sabes completarlo, la historia probablemente no vale. -->

## Criterios de aceptación (Gherkin)

```gherkin
Escenario: <nombre del escenario>
  Dado <estado inicial>
  Cuando <acción>
  Entonces <resultado observable>

Escenario: <caso de borde — siempre al menos uno>
  Dado
  Cuando
  Entonces
```

## Dependencias

<!-- ¿Necesitas el contrato OpenAPI de D3? ¿El GeoJSON de D5? Dilo aquí, no en el daily del día
     en que te bloquee. Ver docs/equipo/secuencia-de-trabajo.md §1 -->

## Terminado cuando

- [ ] Los escenarios Gherkin pasan como pruebas automatizadas
- [ ] PR fusionado con al menos 1 revisor
- [ ] Fila en `docs/gestion/registro-de-implementaciones.md`
- [ ] Fila actualizada en `docs/ingenieria/matriz-trazabilidad.md`
- [ ] Si toca interfaz: checklist de `DESIGN.md` §10
