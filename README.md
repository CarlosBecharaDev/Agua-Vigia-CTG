# AguaVigía CTG

**Plataforma ciudadana de monitoreo y trazabilidad del servicio de acueducto en Cartagena de Indias.**

Cruza los avisos oficiales de Acuacar con reportes ciudadanos georreferenciados y publica un
**Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

> Proyecto de aula · Fundación Universitaria Tecnológico Comfenalco
> Tecnología en Desarrollo de Software · Cartagena de Indias D.T. y C. · 2026

**Estado actual: Sprint 1.** Backend con API de sectores, mapa conectado a datos reales y PWA
instalable ya en `develop`. Detalle vivo: [`docs/gestion/sprint-1.md`](docs/gestion/sprint-1.md).

---

## Estructura del repositorio

Este proyecto está organizado como un **sistema de diseño agéntico**: el contexto vive en archivos
que el agente de IA lee automáticamente, en vez de repetirse en cada conversación.

```
aguavigia-ctg/
│
├── CLAUDE.md              ← Instrucciones del proyecto para el agente. Se versiona.
├── CLAUDE.local.md        ← Tus instrucciones personales. NO se versiona (plantilla: .example)
├── DESIGN.md              ← Sistema de diseño: color, tipografía, voz, accesibilidad.
├── MEMORY.md              ← Memoria persistente: hallazgos verificados y restricciones.
├── .mcp.json              ← Conectores MCP compartidos por el equipo.
│
├── .claude/
│   ├── settings.json        ← Permisos compartidos. Se versiona.
│   ├── settings.local.json  ← Tus permisos. NO se versiona.
│   ├── skills/              ← Habilidades reutilizables
│   │   ├── verificar-arquitectura/   verificar-fuente/
│   │   ├── registrar-decision/       registrar-bug/
│   │   └── registrar-implementacion/ cerrar-sesion/
│   └── agents/              ← Subagentes especializados
│       ├── revisor-dominio.md      analista-requisitos.md
│       └── explorador-fuentes.md
│
├── docs/
│   ├── brief.md                    ← Qué construimos y para quién
│   ├── product-requirements.md     ← 36 RF y 20 RNF con id, prioridad y origen
│   ├── design-decisions.md         ← Bitácora de decisiones (ADR)
│   ├── equipo/                     ← Roles, secuencia de trabajo y ficha de cada rol
│   ├── ingenieria/                 ← Pipeline, auditoría de fuentes, matriz de trazabilidad
│   ├── gestion/                    ← Scrum, bitácora de sesiones, bugs, implementaciones
│   ├── informe-metodologico/       ← Los 4 capítulos académicos
│   ├── anexos/                     ← Los 6 anexos institucionales
│   └── index.html                  ← Presentación del proyecto
│
├── backend/               ← (pendiente) Spring Boot 3.4 · Java 21
└── frontend/              ← (pendiente) React 19 · Vite · TypeScript
```

---

## Por dónde empezar

**Si eres nuevo en el equipo, lee en este orden:**

1. [`docs/brief.md`](docs/brief.md) — entiende qué construimos y por qué
2. [`docs/equipo/roles-y-tareas.md`](docs/equipo/roles-y-tareas.md) — encuentra tu rol y tus tareas
3. [`CLAUDE.md`](CLAUDE.md) — cómo se trabaja aquí (arquitectura, convenciones, ética de datos)
4. [`docs/gestion/protocolo-de-contexto.md`](docs/gestion/protocolo-de-contexto.md) — **cómo trabajar
   con IA sin desperdiciar contexto, y qué se registra siempre**
5. [`DESIGN.md`](DESIGN.md) — si vas a tocar interfaz
6. [`docs/design-decisions.md`](docs/design-decisions.md) — qué ya se decidió y qué se descartó

**Después:** copia `CLAUDE.local.md.example` a `CLAUDE.local.md` y ajústalo a tu rol y tu máquina.
No se sube al repositorio.

---

## Los 9 módulos

| # | Módulo | Responsable |
|---|---|---|
| M1 | Mapa en vivo | D4 Frontend |
| M2 | Reporte ciudadano | D3 (backend) + D4 (UI) |
| M3 | Consenso automático | D2 Dominio |
| M4 | Alertas por correo | D1 |
| M5 | Panel del veedor | D3 (backend) + D4 (UI) |
| M6 | **Índice de Cumplimiento** ⭐ | D2 Dominio |
| M7 | Estadísticas | D5 (datos) + D4 (UI) |
| M8 | Bitácora pública | D1 |
| M9 | Ingesta automática con IA ⭐ | D3 Infraestructura |

---

## Stack

**Backend** Spring Boot 3.4 · Java 21 · Maven · MongoDB · Redis · Anthropic Java SDK
**Frontend** React 19 · Vite · TypeScript · Tailwind · Leaflet · Recharts
**Infraestructura** Docker · GitHub Actions · Render/Railway + MongoDB Atlas + Upstash

Arquitectura Limpia (puertos y adaptadores), verificada automáticamente con ArchUnit.

---

## Tres reglas que no se negocian

**1. `domain/` es Java puro.** Si importa `org.springframework` o `com.mongodb`, la build falla.
No es criterio de nadie: hay un test que lo verifica.

**2. Se respeta `robots.txt` siempre**, incluso cuando técnicamente podríamos evadirlo. Varios
medios bloquean explícitamente a los rastreadores de IA. No se scrapean, no se disfraza el
`User-Agent`, no se discute. Exigirle transparencia a un operador de servicios públicos y colarse
por la puerta trasera de un periódico sería incoherente.

**3. Todo se registra: implementaciones, bugs y sesiones de trabajo.** Un bug arreglado sin registrar
es un bug que el equipo no aprendió, y el Capítulo IV del informe se construye desde esos registros —
en el Sprint 6 ya es tarde para reconstruirlos.

Detalle en `CLAUDE.md`, en `docs/design-decisions.md` (ADR-005, ADR-008) y en
`docs/gestion/protocolo-de-contexto.md`.

---

## Ritmo de trabajo

**7 sprints:** Sprint 0 de preparación + Sprints 1–6 de construcción. 5 integrantes, metodología Scrum.

**Un sprint no dura un número fijo de semanas: dura hasta que su entregable se demuestra funcionando.**
Cerrar por calendario obliga a arrastrar lo que no alcanzó o a inventar trabajo para llenar la semana;
cerrar por entregable deja el avance medido en lo único que se puede demostrar ante el docente.

- Entregables, ceremonias y definición de terminado: [`docs/gestion/README.md`](docs/gestion/README.md)
- Quién habilita a quién y en qué orden: [`docs/equipo/secuencia-de-trabajo.md`](docs/equipo/secuencia-de-trabajo.md)
- Tareas por persona: [`docs/equipo/`](docs/equipo/)

---

## Cómo levantar el proyecto

Requiere un **motor de contenedores** corriendo, no solo el cliente de Docker. En Linux o con Docker
Desktop no hace falta nada más. En macOS sin Docker Desktop, instala [Colima](https://github.com/abiosoft/colima)
(`brew install colima && colima start`) y exporta estas dos variables antes de compilar el backend o
levantar el entorno — son necesarias para que Testcontainers encuentre el daemon y monte el socket
correcto (`BUG-030`):

```bash
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
```

```bash
cp .env.example .env     # ajusta tus variables
docker compose up -d --wait   # Mongo + Redis + Mailhog + backend + frontend, falla si algo no arranca
```

---

*Plataforma ciudadana e independiente. No está afiliada a Aguas de Cartagena S.A. E.S.P.
ni a ninguna entidad distrital.*
