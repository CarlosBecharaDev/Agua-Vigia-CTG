# Capítulo III — Metodología

> ESTRUCTURA SIN VALIDAR CONTRA LA PLANTILLA OFICIAL
>
> Este capítulo se redactó contra el índice reconstruido en `README.md` de este directorio. La
> plantilla institucional del Tecnológico Comfenalco no está aún validada (tarea pendiente de D1,
> `ADR-021`); títulos y numeración pueden diferir. Las fuentes citadas en cada sección son los
> documentos del repositorio — transformar y citar, no inventar. Los valores numéricos de
> población y muestra se dejan explícitamente como pendientes de levantamiento en campo (Anexo 3);
> ningún dato se inventa.

---

## 1. Tipo de investigación

La investigación es de tipo **proyectiva** con **enfoque mixto**, tal como se declara en el formato
académico del proyecto (`CLAUDE.md` § Formato académico; `docs/brief.md` § Contexto académico).

**Proyectiva** porque no se limita a describir o explicar el problema — el vacío de información sobre
los cortes del acueducto — sino que propone una **solución concreta, diseñada y ejecutable**: una
plataforma web que cruza los avisos oficiales con los reportes ciudadanos y publica el Índice de
Cumplimiento (`docs/brief.md` § Qué construimos). La entrega de este tipo de investigación no es un
diagnóstico, es un producto verificado contra el problema que lo motivó.

**Mixta** porque combina dos familias de evidencia sobre el mismo fenómeno:

- **Cuantitativa**: encuesta estructurada con escala Likert (Anexo 1) para medir frecuencia de
  cortes, confianza en la información oficial, utilidad percibida y disposición a reportar; sus
  resultados se validan con **Alfa de Cronbach ≥ 0.75** (`docs/anexos/anexo-1-encuesta.md` § Nota de
  validación estadística).
- **Cualitativa**: entrevistas semiestructuradas a actores clave — veedores ciudadanos, líderes
  comunales y comerciantes — para capturar el *cómo* y el *porqué* detrás de los números (Anexo 2).

La combinación responde al problema del proyecto: el dato duro dice *cuántos* vecinos no reciben
aviso; la entrevista dice *cómo* la falta de aviso les cambia el día. Ambos alimentan el mismo
conjunto de requisitos (`docs/product-requirements.md` §4).

---

## 2. Población y muestra

### 2.1 Población

La población objetivo son los **habitantes de Cartagena de Indias en sectores afectados por cortes o
racionamientos del acueducto** (`docs/anexos/anexo-1-encuesta.md` § Ficha técnica). El contexto del
problema la delimita: entre mayo y julio de 2026 los racionamientos sectorizados afectaron hasta al
**15 % de la población**, y la planta El Bosque — que abastece cerca del **90 %** del agua potable —
redujo su capacidad (`MEMORY.md` § Contexto del problema; `docs/brief.md`). Es una población
deliberadamente amplia porque el producto está dirigido a todo habitante que necesite saber si hay
agua, sin registro y desde un celular (`docs/brief.md` § Para quién).

### 2.2 Muestra

La muestra es **no probabilística por conveniencia**, criterio habitual en proyectos de aula con
alcance de 6 meses y 5 integrantes (`docs/brief.md` § Contexto académico): se convoca a participantes
entre los vecinos de los sectores afectados, comerciantes y líderes comunales accesibles para el
equipo.

**El tamaño de muestra y su composición definitiva se dejan como pendiente de levantamiento en
campo** (Anexo 3). No se fija un número a priori en este documento por dos razones: (1) el Anexo 3
exige datos reales y un valor inventado sería fraude académico (`docs/anexos/README.md` § Reglas), y
(2) la muestra se ajusta a lo efectivamente recogido antes de calcular el Alfa de Cronbach.

---

## 3. Técnicas e instrumentos de recolección

| Instrumento | Anexo | Qué mide | Técnica |
|---|---|---|---|
| Encuesta estructurada | 1 | Frecuencia de cortes, canales de información, confianza en Acuacar, utilidad percibida, disposición a reportar, preocupaciones de privacidad | Likert de 5 puntos y selección única/múltiple, anónima, 5–8 min |
| Entrevista semiestructurada | 2 | Verificación actual de cortes, moderación de reportes, confianza en el Índice de Cumplimiento, circulación de la información, impacto económico de un corte no anunciado, anticipación necesaria | Guion por bloques según perfil (veedor, líder comunal, comerciante), 20–30 min, citas por rol y sector, nunca por nombre |

Ambos instrumentos se construyeron **trazados a los requisitos funcionales**: cada sección de la
encuesta y cada bloque de la entrevista referencia el `RF` que ayuda a validar
(`docs/anexos/anexo-1-encuesta.md` § Trazabilidad; `docs/anexos/anexo-2-guion-entrevista.md` §
Trazabilidad). Ese diseño es el puente entre la elicitación (Objetivo específico 1) y la validación
(Objetivo específico 4) de `docs/product-requirements.md` §4.

### 3.1 Análisis documental como técnica complementaria

El proyecto añade una tercera técnica, específica del desarrollo de software: el **análisis
documental de las fuentes internas del repositorio**. Las decisiones de arquitectura están
registradas en `docs/design-decisions.md` (ADRs), los requisitos en `docs/product-requirements.md`,
y el pipeline de datos y sus fuentes en `docs/ingenieria/pipeline-ingesta-datos.md` y
`docs/ingenieria/auditoria-fuentes-de-datos.md`. El Capítulo IV se construye desde los registros
acumulados (`docs/gestion/registro-de-implementaciones.md`, `registro-de-bugs.md`), no desde la
memoria (`ADR-008`).

---

## 4. Validación de instrumentos

La validación de la consistencia interna de los instrumentos se hace con el **coeficiente Alfa de
Cronbach**, con umbral **≥ 0.75**, sobre las respuestas efectivamente recogidas (`CLAUDE.md` §
Formato académico; `docs/anexos/anexo-1-encuesta.md` § Nota de validación estadística).

Se aplica sobre las secciones de escala Likert de la encuesta (Secciones D, E, F y G del Anexo 1).
El proceso completo — juicio de expertos, aplicación en campo y cálculo — se documenta en el
**Anexo 3 — Validación de instrumentos**, que hoy no existe porque exige datos reales de población
(`docs/anexos/README.md`: Anexo 3, "exige aplicar esos instrumentos a población real, no es un
bloqueo de equipo sino de calendario").

**Regla ética del proyecto:** inventar el valor del Alfa antes de aplicar el instrumento es fraude
académico, no un atajo (`docs/anexos/anexo-1-encuesta.md` § Nota de validación estadística).

---

## 5. Fases del desarrollo — método Scrum

El desarrollo se organiza con **Scrum**, en **7 sprints** (Sprint 0 de preparación + Sprints 1–6),
sin duración fija: un sprint cierra cuando su entregable se demuestra funcionando, no cuando se acaba
la semana (`docs/gestion/README.md` § Los siete sprints).

| Fase | Foco | Entregable que la cierra |
|---|---|---|
| Sprint 0 | Documentación, infraestructura, contratos | Repositorio operativo, `docker compose up` funcionando |
| Sprint 1 | Mapa base y dominio core | Mapa mostrando sectores reales de Cartagena |
| Sprint 2 | Reporte ciudadano y consenso | Un vecino reporta en 2 toques y el consenso cambia el estado |
| Sprint 3 | Administración y alertas | El veedor registra un corte y el suscriptor recibe el correo |
| Sprint 4 | Ingesta con IA y Cumplimiento ⭐ | Un boletín real de Acuacar entra solo y se calcula su índice |
| Sprint 5 | Calidad, accesibilidad y PWA | Cobertura ≥ 70 %, auditoría WCAG AA, E2E en verde |
| Sprint 6 | Entrega final y sustentación | Informe completo, demo desplegada, dataset histórico cargado |

La secuencia de trabajo **D5 → D2 → D3 y D1 → D4 → D5 (QA)** se controla con **cuatro compuertas
verificables** (C0–C3), cada una con un comando que la verifica: una tarea no empieza hasta que la
compuerta de la que depende está abierta, y un rol bloqueado se detiene, registra y avisa en lugar de
rodear el bloqueo (`docs/equipo/secuencia-de-trabajo.md` §1, §2 y §5). Esta mecánica es parte de la
metodología: convierte la coordinación de cinco personas en un artefacto verificable, no en un
acuerdo verbal.

Ceremonias con artefacto escrito: **planning** (objetivo y compromisos en `sprint-N.md`), **review**
(qué se demostró funcionando) y **retrospectiva** (máximo 3 acciones concretas con responsable)
(`docs/gestion/README.md` § Ceremonias). Todo PR fusionado, bug encontrado y sesión de trabajo con IA
se registra en `docs/gestion/` — es la base de evidencia del Capítulo IV (`ADR-008`).

---

## 6. Técnicas de procesamiento y análisis de datos

- **Trazabilidad de requisitos**: cada requisito funcional (36) y no funcional (20) se rastrea desde
  el objetivo específico hasta la historia de usuario, el caso de prueba y la implementación
  (`docs/ingenieria/matriz-trazabilidad.md`).
- **Métricas de calidad de software**: cobertura de pruebas (JaCoCo), con umbral ≥ 70 % en `domain/`
  y `application/` (RNF017); verificación de arquitectura con ArchUnit en CI (RNF018); auditoría de
  accesibilidad WCAG AA (RNF012) y pruebas E2E (Anexo 5).
- **Métricas del clasificador de IA**: precisión, exhaustividad y F1 sobre un **conjunto dorado** de
  100 boletines históricos etiquetados a mano; umbral de precisión ≥ 90 % (RNF019) y prueba de
  regresión del clasificador en CI (`docs/ingenieria/pipeline-ingesta-datos.md` §4).
- **Análisis estadístico de los instrumentos**: Alfa de Cronbach ≥ 0.75 para la encuesta y análisis
  temático de las entrevistas, consolidados en el Anexo 3.

---

## 7. Consideraciones éticas

La ética de datos es parte de la metodología, no un anexo decorativo (`CLAUDE.md` § Ética de datos):

1. **Se respeta `robots.txt` siempre**, aunque técnicamente sea evadible; no se disfraza el
   `User-Agent` (`ADR-005`).
2. **No se scrapean redes sociales ni medios que lo prohíban**; la cobertura de los medios que
   bloquean agentes de IA llega vía agregadores legítimos (`docs/ingenieria/auditoria-fuentes-de-datos.md`).
3. **El colector se identifica siempre** con nombre del proyecto y correo de contacto
   (`CLAUDE.md`; `BL-006` se cerró el 2026-08-08 con el correo real del equipo).
4. **Nada llega al mapa público sin verificación**: toda extracción de IA exige cita textual
   verificable (`ADR-006`), y un sector sin dato se publica con estado nulo, no como `CON_SERVICIO`
   (`ADR-014`).
5. **Sin datos personales**: reportar no requiere cuenta y suscribirse solo pide un correo con baja
   en un clic (RNF008; Ley 1581/2012, desarrollada en el Capítulo II).
6. **Ningún dato de los instrumentos se inventa**: el Alfa de Cronbach y los resultados de encuestas
   y entrevistas se calculan sobre respuestas reales (`docs/anexos/README.md` § Reglas).

---

## 8. Referencias del capítulo

- `CLAUDE.md` — tipo de investigación, formato académico, ética de datos y arquitectura.
- `docs/brief.md` — contexto académico, problema, para quién y alcance.
- `docs/gestion/README.md` — los 7 sprints, ceremonias y reglas de registro.
- `docs/equipo/secuencia-de-trabajo.md` — secuencia D5→D2→D3 y D1→D4→D5, compuertas C0–C3 y protocolo.
- `docs/anexos/anexo-1-encuesta.md` — instrumento cuantitativo y su validación estadística.
- `docs/anexos/anexo-2-guion-entrevista.md` — instrumento cualitativo.
- `docs/anexos/README.md` — estado de los 6 anexos y sus reglas.
- `docs/ingenieria/matriz-trazabilidad.md` — técnica de trazabilidad.
- `docs/ingenieria/pipeline-ingesta-datos.md` §4 — métricas del clasificador de IA.
- `docs/design-decisions.md` — ADR-005, ADR-006, ADR-008, ADR-014.
- `docs/product-requirements.md` §4 — objetivos específicos.
