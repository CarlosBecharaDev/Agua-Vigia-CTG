# Guía de Trabajo por Desarrollador — AguaVigía CTG

> Carpeta de especificación individual de tareas y responsabilidades por rol para la construcción de **AguaVigía CTG**.
> **Nota de organización:** Todos los 5 integrantes del equipo escriben código de producción. La documentación académica y metodológica de D1 se elabora eficientemente con asistencia de Inteligencia Artificial (IA agéntica).

---

## Estructura de Roles del Equipo (100% Desarrolladores de Código)

| Rol | Archivo de Especificación | Módulos de Código Asignados | Capas del Código | Documentación Asistida por IA |
|---|---|---|---|---|
| **D1** | [`D1-desarrollador-notificaciones-bitacora.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D1-desarrollador-notificaciones-bitacora.md) | **M4** (Alertas por correo) y **M8** (Bitácora pública) | `application/`, `infrastructure/mail/`, `api/`, `frontend/` | Informe Metodológico, Anexos 1–4, encuestas (Generados con IA) |
| **D2** | [`D2-backend-dominio.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D2-backend-dominio.md) | **M3** (Consenso) y **M6** (Índice de Cumplimiento ⭐) | `domain/`, `application/` | Patrones de diseño, SOLID y diagrama de clases |
| **D3** | [`D3-backend-infraestructura.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D3-backend-infraestructura.md) | **M2** (Reportes - Back), **M5** (Veedor - Back), **M9** (Pipeline IA ⭐) | `infrastructure/`, `api/` | Modelo de datos (Mongo/Redis) y contrato OpenAPI |
| **D4** | [`D4-frontend.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D4-frontend.md) | **M1** (Mapa en vivo), **M2** (Reportes - UI), **M5** (Veedor - UI) | `frontend/` (React 19 + TS) | Manual de usuario y accesibilidad WCAG AA |
| **D5** | [`D5-devops-qa.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/equipo/D5-devops-qa.md) | **M7** (Estadísticas) + Infraestructura global | Docker, CI/CD, E2E | Plan de pruebas, manual técnico y GeoJSON |

---

## Reglas de Colaboración entre Desarrolladores

1. **Todos Escriben Código**: Ningún integrante está excluido del desarrollo de software. D1 lidera los módulos M4 y M8 mientras apalanca la IA para la redacción de informes.
2. **Contrato de API Primero (OpenAPI)**: D3 y D1 publican sus especificaciones OpenAPI antes de que D4/D1 construyan componentes frontend.
3. **Independencia de Dominio**: D2 garantiza que `domain/` no importe Spring Boot ni MongoDB. ArchUnit valida en CI.
4. **Commits y Pull Requests**: Ningún cambio entra directo a `main` o `develop`. Todo PR requiere al menos 1 revisor.
