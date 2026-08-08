# D5 — DevOps / QA / Datos Geoespaciales

> **Responsable:** Infraestructura de despliegue, Docker, integración continua (CI/CD), datos geoespaciales GeoJSON y aseguramiento de calidad (QA).
> **Módulos asignados:** M7 (Estadísticas) + Infraestructura global del proyecto.
> **Capa del código:** `/backend`, `/frontend`, `.github/workflows`, `docker-compose.yml`.

---

## 1. Especificación del Rol

- Mantiene el repositorio y garantiza la protección de ramas (`main` y `develop`).
- Crea los entornos en **Docker** (Multi-stage Dockerfiles) y la orquestación con `docker compose`.
- Configura los pipelines de **GitHub Actions** para compilar, auditar arquitectura, correr linter y ejecutar pruebas automáticamente.
- Obtiene, limpia y carga la cartografía en formato **GeoJSON** de los sectores/barrios de Cartagena.
- Diseña el plan de pruebas integrales, ejecuciones End-to-End (E2E) con Playwright y pruebas de resiliencia (Chaos Testing).

---

## 2. Plan de Tareas por Sprint

| Sprint | Entregables y Tareas Específicas |
|---|---|
| **Sprint 0** | • Configurar repositorio GitHub, ramas `main` / `develop` y reglas de protección de PR.<br>• Crear `.env.example` y plantillas de PR.<br>• Implementar `docker-compose.yml` base (MongoDB + Redis + Mailhog).<br>• Configurar workflows de GitHub Actions para backend y frontend. |
| **Sprint 1** | • **Obtener y validar el GeoJSON de barrios de Cartagena** (Datos Abiertos Colombia / OpenStreetMap).<br>• Crear script de siembra (seed) para cargar sectores geoespaciales en MongoDB.<br>• Dockerfile multi-etapa optimizado para Spring Boot. |
| **Sprint 2** | • Configurar Testcontainers para pruebas de integración con instancias reales de Mongo y Redis.<br>• Integrar reporte de cobertura con JaCoCo en CI.<br>• **Hacer fallar la build en GitHub Actions si el test de ArchUnit falla**. |
| **Sprint 3** | • Dockerfile multi-etapa para frontend (React Vite $\rightarrow$ Nginx).<br>• Configurar perfiles de Spring (`dev`, `docker`, `prod`).<br>• Implementar escaneo automático de secretos en CI (`gitleaks`). |
| **Sprint 4** | • Desarrollar agregaciones para el dashboard de estadísticas (M7) junto con D4.<br>• Exponer métricas de salud en `/actuator/health`.<br>• **Prueba de Chaos Engineering**: Simular caída de fuentes externas (Acuacar/Prensa) y verificar resiliencia. |
| **Sprint 5** | • Automatizar pruebas End-to-End (E2E) con Playwright.<br>• Configurar despliegue continuo en la nube (Render/Railway + MongoDB Atlas + Upstash Redis).<br>• Prueba de regresión del clasificador de IA en CI ($\ge 90\%$ precisión RNF019). |
| **Sprint 6** | • Redactar Manual Técnico de Instalación y Despliegue.<br>• Redactar Plan e Informe Final de Pruebas de Software.<br>• Cargar dataset histórico real de mayo-julio 2026 para la demostración final. |

---

## 3. Criterios de Aceptación (Definition of Done - DoD)

Un componente de infraestructura o prueba entregada por D5 está **Terminada** cuando:
1. El proyecto se levanta en una máquina limpia usando únicamente `docker compose up`.
2. Las pruebas automáticas y reglas de calidad pasan al 100% en GitHub Actions antes de hacer merge a `develop`.

---

## 4. Recomendaciones Específicas para D5

- **Escaneo de Secretos Temprano**: Añadir `gitleaks` al pipeline de GitHub Actions desde el Sprint 0 para evitar fugas de `ANTHROPIC_API_KEY`.
- **Plan B para GeoJSON**: En caso de inconsistencias en el GeoJSON de barrios oficiales, preparar polígonos simplificados para las 15 localidades/sectores principales de Cartagena.
