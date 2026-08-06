# AguaVigía CTG

**Plataforma ciudadana de monitoreo y trazabilidad del servicio de acueducto en Cartagena de Indias.**

Cruza los avisos oficiales de Acuacar con reportes ciudadanos georreferenciados y publica un
**Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

> Proyecto de aula · Fundación Universitaria Tecnológico Comfenalco
> Tecnología en Desarrollo de Software · Cartagena de Indias D.T. y C. · 2026

**Estado actual: fase de documentación.** El código de la aplicación aún no se ha iniciado.

---

## Estructura del repositorio

Este proyecto está organizado como un **sistema de diseño agéntico**: el contexto vive en archivos
que el agente de IA lee automáticamente, en vez de repetirse en cada conversación.

```
aguavigia-ctg/
│
├── CLAUDE.md              ← Instrucciones del proyecto para el agente. Se versiona.
├── CLAUDE.local.md        ← Tus instrucciones personales. NO se versiona.
├── DESIGN.md              ← Sistema de diseño: color, tipografía, voz, accesibilidad.
├── MEMORY.md              ← Memoria persistente: hallazgos verificados y restricciones.
├── .mcp.json              ← Conectores MCP compartidos por el equipo.
│
├── .claude/
│   ├── settings.json        ← Permisos compartidos. Se versiona.
│   ├── settings.local.json  ← Tus permisos. NO se versiona.
│   ├── skills/              ← Habilidades reutilizables
│   │   ├── verificar-arquitectura/
│   │   ├── verificar-fuente/
│   │   └── registrar-decision/
│   └── agents/              ← Subagentes especializados
│       ├── revisor-dominio.md
│       ├── analista-requisitos.md
│       └── explorador-fuentes.md
│
├── docs/
│   ├── brief.md                    ← Qué construimos y para quién
│   ├── product-requirements.md     ← RF y RNF con id, prioridad y origen
│   ├── design-decisions.md         ← Bitácora de decisiones (ADR)
│   ├── equipo/
│   │   └── roles-y-tareas.md       ← Quién hace qué, sprint por sprint
│   ├── ingenieria/
│   │   ├── pipeline-ingesta-datos.md
│   │   └── auditoria-fuentes-de-datos.md
│   ├── informe-metodologico/       ← (pendiente) 4 capítulos académicos
│   ├── anexos/                     ← (pendiente) 6 anexos institucionales
│   └── presentacion-proyecto.html  ← Presentación del proyecto
│
├── backend/               ← (pendiente) Spring Boot 3.4 · Java 21
└── frontend/              ← (pendiente) React 19 · Vite · TypeScript
```

---

## Por dónde empezar

**Si eres nuevo en el equipo, lee en este orden:**

1. `docs/brief.md` — entiende qué construimos y por qué
2. `docs/equipo/roles-y-tareas.md` — encuentra tu rol y tus tareas
3. `CLAUDE.md` — cómo se trabaja aquí (reglas de arquitectura, convenciones, ética de datos)
4. `DESIGN.md` — si vas a tocar interfaz
5. `docs/design-decisions.md` — qué ya se decidió y qué se descartó

**Después:** copia `CLAUDE.local.md`, ajústalo a tu rol y tu máquina. No se sube al repositorio.

---

## Los 9 módulos

| # | Módulo | Responsable |
|---|---|---|
| M1 | Mapa en vivo | D4 Frontend |
| M2 | Reporte ciudadano | D3 + D4 |
| M3 | Consenso automático | D2 Dominio |
| M4 | Alertas por correo | D3 Infraestructura |
| M5 | Panel del veedor | D3 + D4 |
| M6 | **Índice de Cumplimiento** ⭐ | D2 Dominio |
| M7 | Estadísticas | D5 + D4 |
| M8 | Bitácora pública | D4 Frontend |
| M9 | Ingesta automática con IA | D3 Infraestructura |

---

## Stack

**Backend** Spring Boot 3.4 · Java 21 · Maven · MongoDB · Redis · Anthropic Java SDK
**Frontend** React 19 · Vite · TypeScript · Tailwind · Leaflet · Recharts
**Infraestructura** Docker · GitHub Actions · Render/Railway + MongoDB Atlas + Upstash

Arquitectura Limpia (puertos y adaptadores), verificada automáticamente con ArchUnit.

---

## Dos reglas que no se negocian

**1. `domain/` es Java puro.** Si importa `org.springframework` o `com.mongodb`, la build falla.
No es criterio de nadie: hay un test que lo verifica.

**2. Se respeta `robots.txt` siempre**, incluso cuando técnicamente podríamos evadirlo. Varios
medios bloquean explícitamente a los rastreadores de IA. No se scrapean, no se disfraza el
`User-Agent`, no se discute. Exigirle transparencia a un operador de servicios públicos y colarse
por la puerta trasera de un periódico sería incoherente.

Detalle en `CLAUDE.md` y en `docs/design-decisions.md` (ADR-005).

---

## Cómo levantar el proyecto

> Aún no aplica — el código no ha iniciado. Cuando exista:

```bash
cp .env.example .env     # ajusta tus variables
docker compose up        # Mongo + Redis + Mailhog + backend + frontend
```

---

## Equipo

5 integrantes · 6 sprints de ~4 semanas · Metodología Scrum.
Roles y tareas detalladas en `docs/equipo/roles-y-tareas.md`.

---

*Plataforma ciudadana e independiente. No está afiliada a Aguas de Cartagena S.A. E.S.P.
ni a ninguna entidad distrital.*
