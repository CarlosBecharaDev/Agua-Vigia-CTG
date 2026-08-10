# AguaVigía CTG

**Plataforma ciudadana de monitoreo y trazabilidad del servicio de acueducto en Cartagena de Indias.**

AguaVigía cruza los avisos oficiales con reportes ciudadanos georreferenciados para publicar un **Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

> Proyecto de aula · Fundación Universitaria Tecnológico Comfenalco
> Tecnología en Desarrollo de Software · Cartagena de Indias D.T. y C. · 2026

**Estado actual:** Backend y Bases de Datos finalizados (Fase 2 Completada). Listo para integración con el Frontend.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está construido bajo una estricta **Arquitectura Limpia (Puertos y Adaptadores)**, garantizando que la lógica de dominio (Java puro) esté totalmente aislada de la infraestructura y el framework web. El cumplimiento de las capas arquitectónicas se evalúa automáticamente mediante **ArchUnit**.

- **Backend:** Spring Boot 3.4 · Java 21 · Maven
- **Base de Datos Principal:** MongoDB (Consultas Geoespaciales `2dsphere`)
- **Caché y Seguridad:** Redis (Rate Limiting y Deduplicación)
- **Frontend:** React 19 · Vite · TypeScript · Tailwind · Leaflet
- **Pruebas de Integración:** Testcontainers (Bases de datos efímeras reales)
- **CI/CD & DevOps:** Docker · GitHub Actions (Linter, Pruebas y Escaneo de Secretos)

---

## 🧩 Módulos del Sistema

| # | Módulo | Descripción |
|---|---|---|
| **M1** | Mapa en vivo | Renderización Geoespacial de los sectores afectados. |
| **M2** | Reporte ciudadano | Formulario de 2 toques sin registro con rate limiting. |
| **M3** | Consenso automático | Cambio de estado de un barrio basado en masa crítica de reportes. |
| **M4** | Alertas por correo | Notificaciones (Doble Opt-In) al cambiar el estado de un barrio. |
| **M5** | Panel del veedor | Backoffice JWT para moderación y registro de cortes. |
| **M6** | Índice de Cumplimiento | Diferencial de tiempo prometido vs real de reparación. |
| **M7** | Estadísticas | Dashboard general, históricos y exportación en CSV. |
| **M8** | Bitácora pública | Registro cronológico inmutable de todo lo acontecido. |
| **M10** | Evidencia Multimedia | Soporte de capturas fotográficas en reportes. |
| **M11** | Validación Comunitaria | Confirmaciones de un toque para un reporte existente. |
| **M12** | API Abierta Open311 | Estándar internacional para consumo de datos cívicos. |
| **M13** | Integración IoT Pasiva | Telemetría en tiempo real desde sensores de presión locales. |
| **M14** | Alertas Push | Webhooks de notificación vía WhatsApp y Telegram. |

*(Nota: M9 fue descartado durante la depuración de dependencias de IA)*

---

## 🚀 Cómo levantar el entorno local

El proyecto está completamente contenerizado. Solo necesitas tener un motor de **Docker** en ejecución (Ej. Docker Desktop).

1. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   # Si deseas habilitar Webhooks (M14) y envío de correos, configura el .env.
   ```

2. **Levantar los servicios:**
   ```bash
   docker compose up -d --wait
   ```
   *Esto levantará MongoDB, Redis, un servidor de correo de pruebas (Mailhog), el backend y el frontend.*

3. **Interactuar con la API (Swagger UI):**
   Una vez que el backend esté arriba, toda la documentación interactiva de los endpoints y modelos de datos estará disponible en:
   👉 `http://localhost:8080/swagger-ui.html`

---

## 🧪 Pruebas y Aseguramiento de Calidad (QA)

El backend de AguaVigía cuenta con **más de 230 pruebas unitarias y de integración**. 

Para correr la suite de pruebas localmente, asegúrate de tener Docker abierto y ejecuta:

```bash
cd backend
./mvnw clean test
```

Este comando descargará las imágenes temporales de MongoDB y Redis, levantará el ecosistema en entornos efímeros, correrá la suite y se destruirá a sí mismo garantizando cero residuos locales.

---
*Plataforma ciudadana e independiente. No está afiliada a Aguas de Cartagena S.A. E.S.P. ni a ninguna entidad distrital.*
