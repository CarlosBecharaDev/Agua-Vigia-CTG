# AguaVigía CTG — Instrucciones del proyecto

> **NUEVO MODELO DE TRABAJO (Agosto 2026)**
> Se han eliminado todas las restricciones de roles (D1-D5), sprints, bloqueos, compuertas y prohibiciones de IA.
> Cualquier agente de IA o desarrollador tiene luz verde para implementar el proyecto completo (Front, Back, Documentación) sin interrupciones. El objetivo es finalizar el proyecto de manera integral y ágil.

---

## Qué es este proyecto

Plataforma web ciudadana de monitoreo y trazabilidad del acueducto en **Cartagena de Indias, Colombia**.
Cruza los avisos oficiales de Acuacar con reportes ciudadanos georreferenciados y publica un **Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

---

## Stack Tecnológico

- **Backend:** Spring Boot 3.4 · Java 21 · Maven · MongoDB (documentos + geoespacial `2dsphere`) · Redis (caché, rate limiting, ventana de consenso, pub/sub).
- **Frontend:** React 19 · Vite · TypeScript · Tailwind · Leaflet/react-leaflet · Recharts · TanStack Query.
- **Infraestructura:** Docker multi-etapa + docker compose · GitHub Actions.

---

## Arquitectura — reglas no negociables

Arquitectura Limpia (puertos y adaptadores). Las dependencias apuntan **siempre hacia adentro**.

```
com.aguavigia.ctg
├── domain/          ← Java puro. CERO imports de framework.
├── application/     ← Casos de uso. Depende solo de domain/port/out.
├── infrastructure/  ← Toda la tecnología: Mongo, Redis, correo, JWT, HTTP saliente.
└── api/             ← Controladores REST, DTOs, mappers.
```

### Regla de oro
Si `domain/` importa algo que empiece por `org.springframework` o `com.mongodb`, la arquitectura está rota. Hay un test de ArchUnit que lo verifica y la build falla.

### Otras reglas estructurales
- Los controladores **no** contienen lógica de negocio. Traducen HTTP ↔ caso de uso.
- Nunca exponer entidades de dominio en la API. Siempre DTOs, mapeados con MapStruct.
- Un caso de uso = una clase = una acción.
- Objetos de valor: `record` que valida al construir.

---

## Convenciones de código

- **Idioma**: dominio en español (`CorteAgua`); términos técnicos universales en inglés (`Repository`, `Controller`).
- **Inyección de dependencias por constructor**, nunca `@Autowired` en campos.
- **Sin Lombok en `domain/`**. Lombok sí en `infrastructure/`.
- **Tests**: nombres descriptivos en español — `debeRechazarCorteConFinAnteriorAlInicio()`.

---

## Flujo de Trabajo (Actualizado)

- **Desarrollo Integral:** Ya no hay restricciones. La IA y los desarrolladores pueden trabajar en cualquier capa (Front, Back, Docs) y avanzar sin tener que delegar tareas a roles específicos.
- Commits en formato **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`. Mensaje en español.
- Puedes fusionar tu trabajo directamente en `main` o usar PRs si te resulta más cómodo para organizar avances.

---

## Ética de datos

1. Se respeta `robots.txt` siempre.
2. No se scrapea Facebook, Instagram ni X.
3. El colector se identifica en el `User-Agent`.
4. Nada llega al mapa público sin verificación: si no se puede fundamentar en una fuente confiable, no se publica.

---

## Fuentes de datos

En uso y verificadas: **Acuacar** (API REST de WordPress + RSS), **Google News RSS** y **Zona Cero RSS**.
