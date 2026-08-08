# Anexos institucionales

> Los 6 anexos que exige la plantilla del Tecnológico Comfenalco, con su responsable y el sprint en
> que se producen.

---

## ⚠️ Numeración por validar

La numeración y los títulos de abajo se **reconstruyeron** a partir de lo que ya está asignado en
`docs/equipo/` y `docs/product-requirements.md` §4. La plantilla oficial aún no está en el
repositorio.

**Tarea bloqueante del Sprint 0 (D1):** validar esta lista contra el documento del docente y corregir
lo que difiera. Ver [`../informe-metodologico/README.md`](../informe-metodologico/README.md).

🚧 **Nadie la está haciendo: D1 no tiene titular** (`BL-003` en
[`../gestion/registro-de-bloqueos.md`](../gestion/registro-de-bloqueos.md)). Los Anexos 1–3 vencen en
el Sprint 0 y no tienen responsable. Pedirle la plantilla al docente es un correo y destraba los diez
documentos de esta lista.

---

## Los seis anexos

| # | Anexo | Qué contiene | Resp. | Sprint |
|---|---|---|---|---|
| **1** | Instrumento de encuesta a usuarios | Cuestionario aplicado a habitantes de sectores afectados. Escala Likert, validado con Alfa de Cronbach ≥ 0.75 | D1 | 0 |
| **2** | Guion de entrevista a actores clave | Veedores ciudadanos, líderes comunales, comerciantes. Preguntas semiestructuradas | D1 | 0 |
| **3** | Validación de instrumentos | Juicio de expertos, cálculo del Alfa de Cronbach, tabulación de resultados | D1 | 0 → 4 |
| **4** | Historias de usuario | Formato Gherkin (`Dado / Cuando / Entonces`), trazadas a los `RF` de `docs/product-requirements.md` | D1 | 1 |
| **5** | Plan e informe de pruebas | Estrategia, casos de prueba, resultados de E2E, cobertura JaCoCo, prueba de caos | D5 | 5 → 6 |
| **6** | Modelo de datos | Colecciones de MongoDB, índices (`2dsphere`), estructuras en Redis, diccionario de datos, diagrama E-R | D3 | 6 |

**Entregables complementarios** (no numerados como anexos; su ubicación se confirma con la plantilla):
manual de usuario (D4, Sprint 6) y manual técnico de instalación y despliegue (D5, Sprint 6).

---

## Trazabilidad hacia los objetivos

| Objetivo específico | Anexos que lo evidencian |
|---|---|
| 1. Analizar requisitos mediante elicitación | 1, 2, 4 |
| 2. Diseñar arquitectura limpia y modelo geoespacial | 6 |
| 3. Implementar aplicando SOLID | 4, 5 |
| 4. Validar funcionamiento y aceptación | 3, 5 |

---

## Reglas

- **El Anexo 4 no se escribe aparte de los requisitos.** Cada historia de usuario referencia su `RF`.
  Una historia sin requisito, o un requisito sin historia, es un hueco de trazabilidad que el docente
  va a encontrar. La skill del subagente `analista-requisitos` está hecha para esto.
- **El Anexo 3 exige datos reales.** El Alfa de Cronbach se calcula sobre respuestas efectivamente
  recogidas. Un valor inventado es fraude académico, no un atajo.
- **El Anexo 5 sale del registro, no de la memoria.** Se construye desde
  `docs/gestion/registro-de-bugs.md` y `registro-de-implementaciones.md`. Por eso se registra desde el
  primer día: en el Sprint 6 ya es demasiado tarde para reconstruirlo.
- **El Anexo 6 documenta el esquema real**, verificado contra la base de datos que corre, no el que se
  diseñó en el Sprint 1 y luego cambió.
