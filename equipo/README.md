# Guía de Trabajo por Desarrollador — AguaVigía CTG

> Carpeta de especificación individual de tareas y responsabilidades por rol para la construcción de **AguaVigía CTG**.
> Cada desarrollador es dueño absoluto de sus módulos y responde por sus entregables técnicos y académicos.

---

## Estructura de Roles del Equipo

El equipo consta de 5 integrantes con responsabilidades claramente separadas para garantizar mantenibilidad, Arquitectura Limpia y cumplimiento del marco metodológico Scrum.

| Rol | Archivo de Especificación | Módulos Asignados | Capas del Código | Entregables Principales |
|---|---|---|---|---|
| **D1** | [`D1-scrum-master.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D1-scrum-master.md) | Gestión del Proceso | N/A (Documentación) | Informe Metodológico, Anexos 1–4, encuestas y actas Scrum |
| **D2** | [`D2-backend-dominio.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D2-backend-dominio.md) | M3 (Consenso), M6 (Índice Cumplimiento) ⭐ | `domain/`, `application/` | Reglas de negocio en Java puro, ArchUnit, patrones SOLID |
| **D3** | [`D3-backend-infraestructura.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D3-backend-infraestructura.md) | M2 (Reporte), M4 (Alertas), M5 (Veedor), M9 (IA Ingesta) | `infrastructure/`, `api/` | Adaptadores Mongo/Redis, pipeline de ingesta con IA, OpenAPI |
| **D4** | [`D4-frontend.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D4-frontend.md) | M1 (Mapa), M2 (Reporte), M5 (Veedor), M8 (Bitácora) | `frontend/` (React 19 + TS) | SPA responsive, mapas Leaflet, accesibilidad WCAG AA, PWA |
| **D5** | [`D5-devops-qa.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D5-devops-qa.md) | M7 (Estadísticas) + Infraestructura | Docker, CI/CD, E2E | `docker-compose`, GitHub Actions, GeoJSON, plan de pruebas |

---

## Reglas de Colaboración entre Desarrolladores

1. **Contrato de API Primero (OpenAPI)**: D3 publica la especificación OpenAPI antes de que D4 construya los componentes frontend contra ella.
2. **Independencia de Dominio**: D2 garantiza que `domain/` no importe Spring Boot ni MongoDB. Si ArchUnit falla en CI, D5 bloquea el merge.
3. **Quien Construye, Documenta**: Cada desarrollador redacta la documentación técnica de sus módulos y aporta al informe metodológico administrado por D1.
4. **Commits y Pull Requests**: Ningún cambio entra directo a `main` o `develop`. Todo PR requiere al menos 1 revisor.
