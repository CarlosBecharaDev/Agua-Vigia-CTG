# AguaVigía CTG — Frontend

Aplicación web de una sola página (SPA) para la plataforma de monitoreo del acueducto en Cartagena de Indias.
Consume el backend real de punta a punta — sin datos simulados (ver
[`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md) para el detalle de cada endpoint).

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4  
**Módulos con UI propia:** M1 (Mapa en vivo) · M2 (Reporte ciudadano) · M3/M4 (Suscripciones) ·
M5 (Panel del veedor) · M6 (Índice de Cumplimiento) · M7 (Estadísticas) · M8 (Bitácora pública) ·
M9 (Cola de revisión de la ingesta, en el panel del veedor) · M10 (Evidencia fotográfica) ·
M11 (Confirmar reporte con un clic)

---

## Estructura

```
src/
├── components/     # Componentes reutilizables (Encabezado, SelectorTema…)
├── hooks/          # Hooks propios (useTheme…)
├── pages/          # Una página por ruta (PaginaMapa, PaginaReportar…)
├── index.css       # Tokens de diseño — fuente única (DESIGN.md)
└── main.tsx        # Punto de entrada
```

## Levantar en desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
```

## Diseño

Los tokens de color, tipografía y espaciado viven en [`src/index.css`](src/index.css)  
como custom properties CSS. La fuente de verdad es [`../DESIGN.md`](../DESIGN.md).

## Integración con el backend

El frontend consume siempre la API real bajo `/api` — no hay modo simulación ni datos de ejemplo.
Detalle de qué endpoint usa cada pantalla, cómo levantar contra un backend local y cómo
resincronizar los tipos cuando cambia el contrato: [`INTEGRACION-BACKEND.md`](INTEGRACION-BACKEND.md).
